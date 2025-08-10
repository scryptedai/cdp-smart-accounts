export interface CdpConfig {
    apiKeyId: string;
    apiKeySecret: string;
}
export interface OwnerAccount {
    privateKey: string;
    address: string;
}
export interface SmartAccountInfo {
    name: string;
    address: string;
}
export interface NetworkConfig {
    testnet: string;
    mainnet: string;
}
export interface TokenAddresses {
    WETH: string;
    USDC: string;
}
export declare const CDP_CONFIG: CdpConfig;
export declare const OWNERS: Record<string, OwnerAccount>;
export declare const SMART_ACCOUNTS: Record<string, SmartAccountInfo>;
export declare const NETWORKS: NetworkConfig;
export declare const TOKENS: TokenAddresses;
export declare const PAYMASTER_URL = "https://api.developer.coinbase.com/rpc/v1/base/gHCgcCWsIk5uoHKqyk7XRhjdWeXaCAoh";
export declare const SPENDING_LIMIT_WEI = "50000000000000";
