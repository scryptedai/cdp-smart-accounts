export declare enum NetworkType {
    TESTNET = "base-sepolia",
    MAINNET = "base"
}
export declare enum OwnerType {
    OWNER1 = "owner1",
    OWNER2 = "owner2"
}
export declare class CreateSmartAccountDto {
    name: string;
    ownerType: OwnerType;
    enableSpendPermissions?: boolean;
}
export declare class TransferDto {
    fromOwner: OwnerType;
    toAddress: string;
    amountWei: string;
    network?: NetworkType;
    usePaymaster?: boolean;
}
export declare class SwapDto {
    ownerType: OwnerType;
    fromToken: string;
    toToken: string;
    fromAmountWei: string;
    slippageBps?: string;
    network?: NetworkType;
}
export declare class SpendingLimitDto {
    grantorOwner: OwnerType;
    spenderOwner: OwnerType;
    limitWei: string;
    periodInDays?: string;
}
export declare class FaucetRequestDto {
    ownerType: OwnerType;
    token?: string;
    network?: NetworkType;
}
export declare class BalanceQueryDto {
    ownerType?: OwnerType;
    network?: NetworkType;
}
export declare class SwapPriceDto {
    fromToken: string;
    toToken: string;
    fromAmountWei: string;
    takerAddress: string;
    network?: NetworkType;
}
