import { Injectable, Logger } from '@nestjs/common';
import { CdpClient, parseUnits } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { 
  CDP_CONFIG, 
  OWNERS, 
  SMART_ACCOUNTS, 
  NETWORKS, 
  TOKENS, 
  PAYMASTER_URL,
  SPENDING_LIMIT_WEI 
} from '../config/cdp.config';
import { OwnerType, NetworkType } from '../dto/smart-wallet.dto';

@Injectable()
export class CdpService {
  private readonly logger = new Logger(CdpService.name);
  private readonly cdp: CdpClient;

  constructor() {
    this.cdp = new CdpClient(CDP_CONFIG);
  }

  async getSmartAccount(ownerType: OwnerType) {
    const owner = OWNERS[ownerType];
    const smartAccountInfo = SMART_ACCOUNTS[ownerType];
    
    const ownerAccount = privateKeyToAccount(('0x' + owner.privateKey) as `0x${string}`);
    
    return await this.cdp.evm.getOrCreateSmartAccount({
      name: smartAccountInfo.name,
      owner: ownerAccount,
    });
  }

  async createSmartAccount(name: string, ownerType: OwnerType, enableSpendPermissions = false) {
    const owner = OWNERS[ownerType];
    const ownerAccount = privateKeyToAccount(('0x' + owner.privateKey) as `0x${string}`);
    
    return await this.cdp.evm.getOrCreateSmartAccount({
      name,
      owner: ownerAccount,
      enableSpendPermissions,
    });
  }

  async getBalances(ownerType: OwnerType, network: NetworkType = NetworkType.TESTNET) {
    try {
      const smartAccount = await this.getSmartAccount(ownerType);
      const owner = OWNERS[ownerType];

      // Get EOA balance
      const eoaBalance = await this.cdp.evm.listTokenBalances({
        address: owner.address as `0x${string}`,
        network: network as any,
      });

      // Get Smart Account balance
      const smartAccountBalance = await this.cdp.evm.listTokenBalances({
        address: smartAccount.address,
        network: network as any,
      });

      return {
        ownerType,
        ownerAddress: owner.address,
        smartAccountAddress: smartAccount.address,
        eoaBalances: eoaBalance.balances,
        smartAccountBalances: smartAccountBalance.balances,
      };
    } catch (error) {
      this.logger.error(`Failed to get balances for ${ownerType}:`, error.message);
      throw error;
    }
  }

  async getAllBalances(network: NetworkType = NetworkType.TESTNET) {
    const results: any[] = [];
    
    for (const ownerType of Object.keys(OWNERS) as OwnerType[]) {
      try {
        const balance = await this.getBalances(ownerType, network);
        results.push(balance);
      } catch (error) {
        this.logger.error(`Failed to get balance for ${ownerType}:`, error.message);
        results.push({
          ownerType,
          error: error.message,
        });
      }
    }
    
    return results;
  }

  async requestFaucet(ownerType: OwnerType, token = 'eth', network: NetworkType = NetworkType.TESTNET) {
    try {
      const smartAccount = await this.getSmartAccount(ownerType);
      
      const faucetResult = await this.cdp.evm.requestFaucet({
        address: smartAccount.address,
        network: network as any,
        token: token as any,
      });

      return {
        ownerType,
        smartAccountAddress: smartAccount.address,
        transactionHash: faucetResult.transactionHash,
        explorerUrl: network === NetworkType.TESTNET 
          ? `https://sepolia.basescan.org/tx/${faucetResult.transactionHash}`
          : `https://basescan.org/tx/${faucetResult.transactionHash}`,
      };
    } catch (error) {
      this.logger.error(`Faucet request failed for ${ownerType}:`, error.message);
      throw error;
    }
  }

  async transfer(
    fromOwner: OwnerType,
    toAddress: string,
    amountWei: string,
    network: NetworkType = NetworkType.TESTNET,
    usePaymaster = false
  ) {
    try {
      // Validate spending limit if transferring between our accounts
      const isInternalTransfer = Object.values(SMART_ACCOUNTS).some(
        account => account.address.toLowerCase() === toAddress.toLowerCase()
      );

      if (isInternalTransfer) {
        this.validateSpendingLimit(fromOwner, amountWei);
      }

      const smartAccount = await this.getSmartAccount(fromOwner);
      
      const userOperationOptions: any = {
        calls: [
          {
            to: toAddress as `0x${string}`,
            value: BigInt(amountWei),
            data: '0x',
          },
        ],
        network: network as any,
      };

      if (usePaymaster) {
        userOperationOptions.paymasterUrl = PAYMASTER_URL;
      }

      const userOperation = await smartAccount.sendUserOperation(userOperationOptions);

      this.logger.log(`Transfer initiated: ${userOperation.userOpHash}`);

      const receipt = await smartAccount.waitForUserOperation({
        userOpHash: userOperation.userOpHash,
      });

      return {
        fromOwner,
        fromAddress: smartAccount.address,
        toAddress,
        amountWei,
        userOpHash: userOperation.userOpHash,
        transactionHash: (receipt as any).transactionHash || 'pending',
        status: receipt.status,
        usePaymaster,
        explorerUrl: network === NetworkType.TESTNET 
          ? `https://sepolia.basescan.org/tx/${(receipt as any).transactionHash || 'pending'}`
          : `https://basescan.org/tx/${(receipt as any).transactionHash || 'pending'}`,
      };
    } catch (error) {
      this.logger.error(`Transfer failed:`, error.message);
      throw error;
    }
  }

  async getSwapPrice(
    fromToken: string,
    toToken: string,
    fromAmountWei: string,
    takerAddress: string,
    network: NetworkType = NetworkType.MAINNET
  ) {
    try {
      const priceEstimate = await this.cdp.evm.getSwapPrice({
        fromToken: fromToken as `0x${string}`,
        toToken: toToken as `0x${string}`,
        fromAmount: BigInt(fromAmountWei),
        network: network as any,
        taker: takerAddress as `0x${string}`,
      });

      return {
        fromToken,
        toToken,
        fromAmount: fromAmountWei,
        toAmount: (priceEstimate as any).toAmount || '0',
        minToAmount: (priceEstimate as any).minToAmount || '0',
        liquidityAvailable: priceEstimate.liquidityAvailable,
        network,
      };
    } catch (error) {
      this.logger.error(`Get swap price failed:`, error.message);
      throw error;
    }
  }

  async executeSwap(
    ownerType: OwnerType,
    fromToken: string,
    toToken: string,
    fromAmountWei: string,
    slippageBps = '100',
    network: NetworkType = NetworkType.MAINNET
  ) {
    try {
      const smartAccount = await this.getSmartAccount(ownerType);

      const result = await smartAccount.swap({
        network: network as any,
        fromToken: fromToken as `0x${string}`,
        toToken: toToken as `0x${string}`,
        fromAmount: BigInt(fromAmountWei),
        slippageBps: parseInt(slippageBps),
      });

      this.logger.log(`Swap initiated: ${result.userOpHash}`);

      const receipt = await smartAccount.waitForUserOperation({
        userOpHash: result.userOpHash,
      });

      return {
        ownerType,
        smartAccountAddress: smartAccount.address,
        fromToken,
        toToken,
        fromAmount: fromAmountWei,
        toAmount: (result as any).toAmount || '0',
        slippageBps,
        userOpHash: result.userOpHash,
        transactionHash: (receipt as any).transactionHash || 'pending',
        status: receipt.status,
        explorerUrl: network === NetworkType.TESTNET 
          ? `https://sepolia.basescan.org/tx/${(receipt as any).transactionHash || 'pending'}`
          : `https://basescan.org/tx/${(receipt as any).transactionHash || 'pending'}`,
      };
    } catch (error) {
      this.logger.error(`Swap failed:`, error.message);
      throw error;
    }
  }

  validateSpendingLimit(spenderOwner: OwnerType, amountWei: string) {
    const spenderAddress = SMART_ACCOUNTS[spenderOwner]?.address;
    const authorizedSpender = SMART_ACCOUNTS.owner2.address;

    // Check if spender is authorized
    if (spenderAddress?.toLowerCase() !== authorizedSpender.toLowerCase()) {
      throw new Error(`Unauthorized spender: ${spenderAddress}`);
    }

    // Check if amount exceeds limit
    const amount = BigInt(amountWei);
    const limit = BigInt(SPENDING_LIMIT_WEI);
    
    if (amount > limit) {
      throw new Error(
        `Amount ${amount} wei exceeds spending limit of ${limit} wei (0.00005 ETH)`
      );
    }

    return true;
  }

  formatEthAmount(amountWei: string): string {
    const amount = BigInt(amountWei);
    return (Number(amount) / 1e18).toFixed(6);
  }
}