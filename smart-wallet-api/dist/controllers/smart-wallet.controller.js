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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SmartWalletController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartWalletController = void 0;
const common_1 = require("@nestjs/common");
const cdp_service_1 = require("../services/cdp.service");
const smart_wallet_dto_1 = require("../dto/smart-wallet.dto");
let SmartWalletController = SmartWalletController_1 = class SmartWalletController {
    cdpService;
    logger = new common_1.Logger(SmartWalletController_1.name);
    constructor(cdpService) {
        this.cdpService = cdpService;
    }
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'Smart Wallet API',
        };
    }
    async getBalances(query) {
        try {
            if (query.ownerType) {
                return await this.cdpService.getBalances(query.ownerType, query.network);
            }
            return await this.cdpService.getAllBalances(query.network);
        }
        catch (error) {
            this.logger.error('Failed to get balances:', error.message);
            throw new common_1.HttpException(`Failed to get balances: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getBalancesByOwner(ownerType, network = smart_wallet_dto_1.NetworkType.TESTNET) {
        try {
            return await this.cdpService.getBalances(ownerType, network);
        }
        catch (error) {
            this.logger.error(`Failed to get balances for ${ownerType}:`, error.message);
            throw new common_1.HttpException(`Failed to get balances for ${ownerType}: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async requestFaucet(faucetDto) {
        try {
            return await this.cdpService.requestFaucet(faucetDto.ownerType, faucetDto.token, faucetDto.network);
        }
        catch (error) {
            this.logger.error('Faucet request failed:', error.message);
            throw new common_1.HttpException(`Faucet request failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async transfer(transferDto) {
        try {
            return await this.cdpService.transfer(transferDto.fromOwner, transferDto.toAddress, transferDto.amountWei, transferDto.network, transferDto.usePaymaster);
        }
        catch (error) {
            this.logger.error('Transfer failed:', error.message);
            if (error.message.includes('spending limit')) {
                throw new common_1.HttpException(`Transfer blocked by spending limit: ${error.message}`, common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException(`Transfer failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSwapPrice(swapPriceDto) {
        try {
            return await this.cdpService.getSwapPrice(swapPriceDto.fromToken, swapPriceDto.toToken, swapPriceDto.fromAmountWei, swapPriceDto.takerAddress, swapPriceDto.network);
        }
        catch (error) {
            this.logger.error('Get swap price failed:', error.message);
            throw new common_1.HttpException(`Get swap price failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async executeSwap(swapDto) {
        try {
            return await this.cdpService.executeSwap(swapDto.ownerType, swapDto.fromToken, swapDto.toToken, swapDto.fromAmountWei, swapDto.slippageBps, swapDto.network);
        }
        catch (error) {
            this.logger.error('Swap execution failed:', error.message);
            throw new common_1.HttpException(`Swap execution failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validateSpendingLimit(body) {
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
        }
        catch (error) {
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
    async testSpendingLimit() {
        try {
            const results = [];
            try {
                const validAmount = '30000000000000';
                this.cdpService.validateSpendingLimit(smart_wallet_dto_1.OwnerType.OWNER2, validAmount);
                results.push({
                    test: 'Valid amount (0.00003 ETH)',
                    amountWei: validAmount,
                    amountEth: this.cdpService.formatEthAmount(validAmount),
                    result: 'PASSED',
                    status: 'valid',
                });
            }
            catch (error) {
                results.push({
                    test: 'Valid amount (0.00003 ETH)',
                    result: 'FAILED',
                    status: 'invalid',
                    error: error.message,
                });
            }
            try {
                const excessiveAmount = '100000000000000000';
                this.cdpService.validateSpendingLimit(smart_wallet_dto_1.OwnerType.OWNER2, excessiveAmount);
                results.push({
                    test: 'Excessive amount (0.1 ETH)',
                    amountWei: excessiveAmount,
                    amountEth: this.cdpService.formatEthAmount(excessiveAmount),
                    result: 'FAILED - Should have been blocked',
                    status: 'unexpected_pass',
                });
            }
            catch (error) {
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
        }
        catch (error) {
            throw new common_1.HttpException(`Spending limit test failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.SmartWalletController = SmartWalletController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SmartWalletController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('balances'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [smart_wallet_dto_1.BalanceQueryDto]),
    __metadata("design:returntype", Promise)
], SmartWalletController.prototype, "getBalances", null);
__decorate([
    (0, common_1.Get)('balances/:ownerType'),
    __param(0, (0, common_1.Param)('ownerType')),
    __param(1, (0, common_1.Query)('network')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SmartWalletController.prototype, "getBalancesByOwner", null);
__decorate([
    (0, common_1.Post)('faucet'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [smart_wallet_dto_1.FaucetRequestDto]),
    __metadata("design:returntype", Promise)
], SmartWalletController.prototype, "requestFaucet", null);
__decorate([
    (0, common_1.Post)('transfer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [smart_wallet_dto_1.TransferDto]),
    __metadata("design:returntype", Promise)
], SmartWalletController.prototype, "transfer", null);
__decorate([
    (0, common_1.Post)('swap/price'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [smart_wallet_dto_1.SwapPriceDto]),
    __metadata("design:returntype", Promise)
], SmartWalletController.prototype, "getSwapPrice", null);
__decorate([
    (0, common_1.Post)('swap'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [smart_wallet_dto_1.SwapDto]),
    __metadata("design:returntype", Promise)
], SmartWalletController.prototype, "executeSwap", null);
__decorate([
    (0, common_1.Post)('spending-limit/validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmartWalletController.prototype, "validateSpendingLimit", null);
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SmartWalletController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Get)('smart-accounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SmartWalletController.prototype, "getSmartAccountInfo", null);
__decorate([
    (0, common_1.Post)('demo/spending-limit-test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SmartWalletController.prototype, "testSpendingLimit", null);
exports.SmartWalletController = SmartWalletController = SmartWalletController_1 = __decorate([
    (0, common_1.Controller)('smart-wallet'),
    __metadata("design:paramtypes", [cdp_service_1.CdpService])
], SmartWalletController);
//# sourceMappingURL=smart-wallet.controller.js.map