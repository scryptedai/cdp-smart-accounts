import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Param, 
  Logger,
  HttpException,
  HttpStatus 
} from '@nestjs/common';
import { CdpService } from '../services/cdp.service';
import {
  CreateSmartAccountDto,
  TransferDto,
  SwapDto,
  SpendingLimitDto,
  FaucetRequestDto,
  BalanceQueryDto,
  SwapPriceDto,
  OwnerType,
  NetworkType,
} from '../dto/smart-wallet.dto';

@Controller('smart-wallet')
export class SmartWalletController {
  private readonly logger = new Logger(SmartWalletController.name);

  constructor(private readonly cdpService: CdpService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Smart Wallet API',
    };
  }

  @Get('balances')
  async getBalances(@Query() query: BalanceQueryDto) {
    try {
      if (query.ownerType) {
        return await this.cdpService.getBalances(query.ownerType, query.network);
      }
      return await this.cdpService.getAllBalances(query.network);
    } catch (error) {
      this.logger.error('Failed to get balances:', error.message);
      throw new HttpException(
        `Failed to get balances: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('balances/:ownerType')
  async getBalancesByOwner(
    @Param('ownerType') ownerType: OwnerType,
    @Query('network') network: NetworkType = NetworkType.TESTNET,
  ) {
    try {
      return await this.cdpService.getBalances(ownerType, network);
    } catch (error) {
      this.logger.error(`Failed to get balances for ${ownerType}:`, error.message);
      throw new HttpException(
        `Failed to get balances for ${ownerType}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('faucet')
  async requestFaucet(@Body() faucetDto: FaucetRequestDto) {
    try {
      return await this.cdpService.requestFaucet(
        faucetDto.ownerType,
        faucetDto.token,
        faucetDto.network,
      );
    } catch (error) {
      this.logger.error('Faucet request failed:', error.message);
      throw new HttpException(
        `Faucet request failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('transfer')
  async transfer(@Body() transferDto: TransferDto) {
    try {
      return await this.cdpService.transfer(
        transferDto.fromOwner,
        transferDto.toAddress,
        transferDto.amountWei,
        transferDto.network,
        transferDto.usePaymaster,
      );
    } catch (error) {
      this.logger.error('Transfer failed:', error.message);
      
      if (error.message.includes('spending limit')) {
        throw new HttpException(
          `Transfer blocked by spending limit: ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      
      throw new HttpException(
        `Transfer failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('swap/price')
  async getSwapPrice(@Body() swapPriceDto: SwapPriceDto) {
    try {
      return await this.cdpService.getSwapPrice(
        swapPriceDto.fromToken,
        swapPriceDto.toToken,
        swapPriceDto.fromAmountWei,
        swapPriceDto.takerAddress,
        swapPriceDto.network,
      );
    } catch (error) {
      this.logger.error('Get swap price failed:', error.message);
      throw new HttpException(
        `Get swap price failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('swap')
  async executeSwap(@Body() swapDto: SwapDto) {
    try {
      return await this.cdpService.executeSwap(
        swapDto.ownerType,
        swapDto.fromToken,
        swapDto.toToken,
        swapDto.fromAmountWei,
        swapDto.slippageBps,
        swapDto.network,
      );
    } catch (error) {
      this.logger.error('Swap execution failed:', error.message);
      throw new HttpException(
        `Swap execution failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('spending-limit/validate')
  async validateSpendingLimit(@Body() body: { ownerType: OwnerType; amountWei: string }) {
    try {
      const isValid = this.cdpService.validateSpendingLimit(body.ownerType, body.amountWei);
      return {
        valid: isValid,
        ownerType: body.ownerType,
        amountWei: body.amountWei,
        amountEth: this.cdpService.formatEthAmount(body.amountWei),
        spendingLimitWei: '50000000000000',
        spendingLimitEth: '0.00005',
      };
    } catch (error) {
      return {
        valid: false,
        ownerType: body.ownerType,
        amountWei: body.amountWei,
        amountEth: this.cdpService.formatEthAmount(body.amountWei),
        spendingLimitWei: '50000000000000',
        spendingLimitEth: '0.00005',
        error: error.message,
      };
    }
  }

  @Get('config')
  async getConfig() {
    return {
      networks: {
        testnet: 'base-sepolia',
        mainnet: 'base',
      },
      tokens: {
        WETH: '0x4200000000000000000000000000000000000006',
        USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
      spendingLimit: {
        wei: '50000000000000',
        eth: '0.00005',
        description: '50% of original balance (0.0001 ETH)',
      },
      owners: ['owner1', 'owner2'],
      paymaster: {
        enabled: true,
        url: 'https://api.developer.coinbase.com/rpc/v1/base/gHCgcCWsIk5uoHKqyk7XRhjdWeXaCAoh',
      },
    };
  }

  @Get('smart-accounts')
  async getSmartAccountInfo() {
    return {
      owner1: {
        name: 'smart-account-1',
        address: '0x382d233262Fc9737188B6F6b2a25a24e05319F5E',
        ownerAddress: '0x43451967B63410E569D0ea94d83AaE137d6Bca59',
      },
      owner2: {
        name: 'smart-account-2',
        address: '0x55f7415B24eA71537d8E4b9Cb09Dc8244D36f231',
        ownerAddress: '0xcbea75EF639963f02170A81f86469cc4710f13d3',
      },
    };
  }

  @Post('demo/spending-limit-test')
  async testSpendingLimit() {
    try {
      const results: any[] = [];

      // Test 1: Valid amount (0.00003 ETH)
      try {
        const validAmount = '30000000000000'; // 0.00003 ETH
        this.cdpService.validateSpendingLimit(OwnerType.OWNER2, validAmount);
        results.push({
          test: 'Valid amount (0.00003 ETH)',
          amountWei: validAmount,
          amountEth: this.cdpService.formatEthAmount(validAmount),
          result: 'PASSED',
          status: 'valid',
        });
      } catch (error) {
        results.push({
          test: 'Valid amount (0.00003 ETH)',
          result: 'FAILED',
          status: 'invalid',
          error: error.message,
        });
      }

      // Test 2: Excessive amount (0.1 ETH)
      try {
        const excessiveAmount = '100000000000000000'; // 0.1 ETH
        this.cdpService.validateSpendingLimit(OwnerType.OWNER2, excessiveAmount);
        results.push({
          test: 'Excessive amount (0.1 ETH)',
          amountWei: excessiveAmount,
          amountEth: this.cdpService.formatEthAmount(excessiveAmount),
          result: 'FAILED - Should have been blocked',
          status: 'unexpected_pass',
        });
      } catch (error) {
        results.push({
          test: 'Excessive amount (0.1 ETH)',
          amountWei: '100000000000000000',
          amountEth: '0.100000',
          result: 'PASSED - Correctly blocked',
          status: 'correctly_blocked',
          error: error.message,
        });
      }

      return {
        summary: 'Spending limit validation tests completed',
        spendingLimit: {
          wei: '50000000000000',
          eth: '0.00005',
        },
        tests: results,
      };
    } catch (error) {
      throw new HttpException(
        `Spending limit test failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
