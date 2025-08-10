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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapPriceDto = exports.BalanceQueryDto = exports.FaucetRequestDto = exports.SpendingLimitDto = exports.SwapDto = exports.TransferDto = exports.CreateSmartAccountDto = exports.OwnerType = exports.NetworkType = void 0;
const class_validator_1 = require("class-validator");
var NetworkType;
(function (NetworkType) {
    NetworkType["TESTNET"] = "base-sepolia";
    NetworkType["MAINNET"] = "base";
})(NetworkType || (exports.NetworkType = NetworkType = {}));
var OwnerType;
(function (OwnerType) {
    OwnerType["OWNER1"] = "owner1";
    OwnerType["OWNER2"] = "owner2";
})(OwnerType || (exports.OwnerType = OwnerType = {}));
class CreateSmartAccountDto {
    name;
    ownerType;
    enableSpendPermissions;
}
exports.CreateSmartAccountDto = CreateSmartAccountDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSmartAccountDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(OwnerType),
    __metadata("design:type", String)
], CreateSmartAccountDto.prototype, "ownerType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSmartAccountDto.prototype, "enableSpendPermissions", void 0);
class TransferDto {
    fromOwner;
    toAddress;
    amountWei;
    network = NetworkType.TESTNET;
    usePaymaster = false;
}
exports.TransferDto = TransferDto;
__decorate([
    (0, class_validator_1.IsEnum)(OwnerType),
    __metadata("design:type", String)
], TransferDto.prototype, "fromOwner", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferDto.prototype, "toAddress", void 0);
__decorate([
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], TransferDto.prototype, "amountWei", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NetworkType),
    __metadata("design:type", String)
], TransferDto.prototype, "network", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TransferDto.prototype, "usePaymaster", void 0);
class SwapDto {
    ownerType;
    fromToken;
    toToken;
    fromAmountWei;
    slippageBps = '100';
    network = NetworkType.MAINNET;
}
exports.SwapDto = SwapDto;
__decorate([
    (0, class_validator_1.IsEnum)(OwnerType),
    __metadata("design:type", String)
], SwapDto.prototype, "ownerType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SwapDto.prototype, "fromToken", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SwapDto.prototype, "toToken", void 0);
__decorate([
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], SwapDto.prototype, "fromAmountWei", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], SwapDto.prototype, "slippageBps", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NetworkType),
    __metadata("design:type", String)
], SwapDto.prototype, "network", void 0);
class SpendingLimitDto {
    grantorOwner;
    spenderOwner;
    limitWei;
    periodInDays = '1';
}
exports.SpendingLimitDto = SpendingLimitDto;
__decorate([
    (0, class_validator_1.IsEnum)(OwnerType),
    __metadata("design:type", String)
], SpendingLimitDto.prototype, "grantorOwner", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(OwnerType),
    __metadata("design:type", String)
], SpendingLimitDto.prototype, "spenderOwner", void 0);
__decorate([
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], SpendingLimitDto.prototype, "limitWei", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], SpendingLimitDto.prototype, "periodInDays", void 0);
class FaucetRequestDto {
    ownerType;
    token = 'eth';
    network = NetworkType.TESTNET;
}
exports.FaucetRequestDto = FaucetRequestDto;
__decorate([
    (0, class_validator_1.IsEnum)(OwnerType),
    __metadata("design:type", String)
], FaucetRequestDto.prototype, "ownerType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FaucetRequestDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NetworkType),
    __metadata("design:type", String)
], FaucetRequestDto.prototype, "network", void 0);
class BalanceQueryDto {
    ownerType;
    network = NetworkType.TESTNET;
}
exports.BalanceQueryDto = BalanceQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(OwnerType),
    __metadata("design:type", String)
], BalanceQueryDto.prototype, "ownerType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NetworkType),
    __metadata("design:type", String)
], BalanceQueryDto.prototype, "network", void 0);
class SwapPriceDto {
    fromToken;
    toToken;
    fromAmountWei;
    takerAddress;
    network = NetworkType.MAINNET;
}
exports.SwapPriceDto = SwapPriceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SwapPriceDto.prototype, "fromToken", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SwapPriceDto.prototype, "toToken", void 0);
__decorate([
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], SwapPriceDto.prototype, "fromAmountWei", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SwapPriceDto.prototype, "takerAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NetworkType),
    __metadata("design:type", String)
], SwapPriceDto.prototype, "network", void 0);
//# sourceMappingURL=smart-wallet.dto.js.map