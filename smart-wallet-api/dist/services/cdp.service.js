"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CdpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdpService = void 0;
const common_1 = require("@nestjs/common");
const cdp_sdk_1 = require("@coinbase/cdp-sdk");
const accounts_1 = require("viem/accounts");
const cdp_config_1 = require("../config/cdp.config");
const smart_wallet_dto_1 = require("../dto/smart-wallet.dto");
let CdpService = CdpService_1 = class CdpService {
    logger = new common_1.Logger(CdpService_1.name);
    cdp;
    constructor() {
        this.cdp = new cdp_sdk_1.CdpClient(cdp_config_1.CDP_CONFIG);
    }
    async getSmartAccount(ownerType) {
        const owner = cdp_config_1.OWNERS[ownerType];
        const smartAccountInfo = cdp_config_1.SMART_ACCOUNTS[ownerType];
        const ownerAccount = (0, accounts_1.privateKeyToAccount)(('0x' + owner.privateKey));
        return await this.cdp.evm.getOrCreateSmartAccount({
            name: smartAccountInfo.name,
            owner: ownerAccount,
        });
    }
    async createSmartAccount(name, ownerType, enableSpendPermissions = false) {
        const owner = cdp_config_1.OWNERS[ownerType];
        const ownerAccount = (0, accounts_1.privateKeyToAccount)(('0x' + owner.privateKey));
        return await this.cdp.evm.getOrCreateSmartAccount({
            name,
            owner: ownerAccount,
            enableSpendPermissions,
        });
    }
    async getBalances(ownerType, network = smart_wallet_dto_1.NetworkType.TESTNET) {
        try {
            const smartAccount = await this.getSmartAccount(ownerType);
            const owner = cdp_config_1.OWNERS[ownerType];
            const eoaBalance = await this.cdp.evm.listTokenBalances({
                address: owner.address,
                network: network,
            });
            const smartAccountBalance = await this.cdp.evm.listTokenBalances({
                address: smartAccount.address,
                network: network,
            });
            return {
                ownerType,
                ownerAddress: owner.address,
                smartAccountAddress: smartAccount.address,
                eoaBalances: eoaBalance.balances,
                smartAccountBalances: smartAccountBalance.balances,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get balances for ${ownerType}:`, error.message);
            throw error;
        }
    }
    async getAllBalances(network = smart_wallet_dto_1.NetworkType.TESTNET) {
        const results = [];
        for (const ownerType of Object.keys(cdp_config_1.OWNERS)) {
            try {
                const balance = await this.getBalances(ownerType, network);
                results.push(balance);
            }
            catch (error) {
                this.logger.error(`Failed to get balance for ${ownerType}:`, error.message);
                results.push({
                    ownerType,
                    error: error.message,
                });
            }
        }
        return results;
    }
    async requestFaucet(ownerType, token = 'eth', network = smart_wallet_dto_1.NetworkType.TESTNET) {
        try {
            const smartAccount = await this.getSmartAccount(ownerType);
            const faucetResult = await this.cdp.evm.requestFaucet({
                address: smartAccount.address,
                network: network,
                token: token,
            });
            return {
                ownerType,
                smartAccountAddress: smartAccount.address,
                transactionHash: faucetResult.transactionHash,
                explorerUrl: network === smart_wallet_dto_1.NetworkType.TESTNET
                    ? `https://sepolia.basescan.org/tx/${faucetResult.transactionHash}`
                    : `https://basescan.org/tx/${faucetResult.transactionHash}`,
            };
        }
        catch (error) {
            this.logger.error(`Faucet request failed for ${ownerType}:`, error.message);
            throw error;
        }
    }
    async transfer(fromOwner, toAddress, amountWei, network = smart_wallet_dto_1.NetworkType.TESTNET, usePaymaster = false) {
        try {
            const isInternalTransfer = Object.values(cdp_config_1.SMART_ACCOUNTS).some(account => account.address.toLowerCase() === toAddress.toLowerCase());
            if (isInternalTransfer) {
                this.validateSpendingLimit(fromOwner, amountWei);
            }
            const smartAccount = await this.getSmartAccount(fromOwner);
            const userOperationOptions = {
                calls: [
                    {
                        to: toAddress,
                        value: BigInt(amountWei),
                        data: '0x',
                    },
                ],
                network: network,
            };
            if (usePaymaster) {
                userOperationOptions.paymasterUrl = cdp_config_1.PAYMASTER_URL;
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
                transactionHash: receipt.transactionHash || 'pending',
                status: receipt.status,
                usePaymaster,
                explorerUrl: network === smart_wallet_dto_1.NetworkType.TESTNET
                    ? `https://sepolia.basescan.org/tx/${receipt.transactionHash || 'pending'}`
                    : `https://basescan.org/tx/${receipt.transactionHash || 'pending'}`,
            };
        }
        catch (error) {
            this.logger.error(`Transfer failed:`, error.message);
            throw error;
        }
    }
    async getSwapPrice(fromToken, toToken, fromAmountWei, takerAddress, network = smart_wallet_dto_1.NetworkType.MAINNET) {
        try {
            const priceEstimate = await this.cdp.evm.getSwapPrice({
                fromToken: fromToken,
                toToken: toToken,
                fromAmount: BigInt(fromAmountWei),
                network: network,
                taker: takerAddress,
            });
            return {
                fromToken,
                toToken,
                fromAmount: fromAmountWei,
                toAmount: priceEstimate.toAmount || '0',
                minToAmount: priceEstimate.minToAmount || '0',
                liquidityAvailable: priceEstimate.liquidityAvailable,
                network,
            };
        }
        catch (error) {
            this.logger.error(`Get swap price failed:`, error.message);
            throw error;
        }
    }
    async executeSwap(ownerType, fromToken, toToken, fromAmountWei, slippageBps = '100', network = smart_wallet_dto_1.NetworkType.MAINNET) {
        try {
            const smartAccount = await this.getSmartAccount(ownerType);
            const result = await smartAccount.swap({
                network: network,
                fromToken: fromToken,
                toToken: toToken,
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
                toAmount: result.toAmount || '0',
                slippageBps,
                userOpHash: result.userOpHash,
                transactionHash: receipt.transactionHash || 'pending',
                status: receipt.status,
                explorerUrl: network === smart_wallet_dto_1.NetworkType.TESTNET
                    ? `https://sepolia.basescan.org/tx/${receipt.transactionHash || 'pending'}`
                    : `https://basescan.org/tx/${receipt.transactionHash || 'pending'}`,
            };
        }
        catch (error) {
            this.logger.error(`Swap failed:`, error.message);
            throw error;
        }
    }
    validateSpendingLimit(spenderOwner, amountWei) {
        const spenderAddress = cdp_config_1.SMART_ACCOUNTS[spenderOwner]?.address;
        const authorizedSpender = cdp_config_1.SMART_ACCOUNTS.owner2.address;
        if (spenderAddress?.toLowerCase() !== authorizedSpender.toLowerCase()) {
            throw new Error(`Unauthorized spender: ${spenderAddress}`);
        }
        const amount = BigInt(amountWei);
        const limit = BigInt(cdp_config_1.SPENDING_LIMIT_WEI);
        if (amount > limit) {
            throw new Error(`Amount ${amount} wei exceeds spending limit of ${limit} wei (0.00005 ETH)`);
        }
        return true;
    }
    formatEthAmount(amountWei) {
        const amount = BigInt(amountWei);
        return (Number(amount) / 1e18).toFixed(6);
    }
};
exports.CdpService = CdpService;
exports.CdpService = CdpService = CdpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CdpService);
//# sourceMappingURL=cdp.service.js.map