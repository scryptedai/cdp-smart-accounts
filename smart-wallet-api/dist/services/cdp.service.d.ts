import { OwnerType, NetworkType } from '../dto/smart-wallet.dto';
export declare class CdpService {
    private readonly logger;
    private readonly cdp;
    constructor();
    getSmartAccount(ownerType: OwnerType): Promise<{
        address: import("node_modules/@coinbase/cdp-sdk/_types/types/misc").Address;
        name?: string | undefined;
        owners: import("node_modules/@coinbase/cdp-sdk/_types/accounts/evm/types").EvmAccount[];
        type: "evm-smart";
        policies: string[] | undefined;
        useNetwork: <Network extends import("node_modules/@coinbase/cdp-sdk/_types/accounts/evm/types").KnownEvmNetworks>(network: Network) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/accounts/evm/types").NetworkScopedEvmSmartAccount<Network>>;
        listTokenBalances: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/listTokenBalances").ListTokenBalancesOptions, "address">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/listTokenBalances").ListTokenBalancesResult>;
        requestFaucet: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/requestFaucet").RequestFaucetOptions, "address">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/requestFaucet").RequestFaucetResult>;
        quoteFund: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/fund/quoteFund").EvmQuoteFundOptions, "address">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/Quote").EvmQuote>;
        fund: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/fund/fund").EvmFundOptions, "address">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/types").FundOperationResult>;
        waitForFundOperationReceipt: (options: import("node_modules/@coinbase/cdp-sdk/_types/actions/waitForFundOperationReceipt").WaitForFundOperationOptions) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/waitForFundOperationReceipt").WaitForFundOperationResult>;
        transfer: (options: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/transfer/types").SmartAccountTransferOptions) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/sendUserOperation").SendUserOperationReturnType>;
        sendUserOperation: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/sendUserOperation").SendUserOperationOptions<unknown[]>, "smartAccount">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/sendUserOperation").SendUserOperationReturnType>;
        waitForUserOperation: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/waitForUserOperation").WaitForUserOperationOptions, "smartAccountAddress">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/waitForUserOperation").WaitForUserOperationReturnType>;
        getUserOperation: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/client/evm/evm.types").GetUserOperationOptions, "smartAccount">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/client/evm/evm.types").UserOperation>;
        quoteSwap: (options: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/swap/types").SmartAccountQuoteSwapOptions) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/swap/types").SmartAccountQuoteSwapResult>;
        swap: (options: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/swap/types").SmartAccountSwapOptions) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/swap/types").SmartAccountSwapResult>;
        signTypedData: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/client/evm/evm.types").SignTypedDataOptions, "address"> & {
            network: import("node_modules/@coinbase/cdp-sdk/_types/accounts/evm/types").KnownEvmNetworks;
        }) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/types/misc").Hex>;
        useSpendPermission: (options: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/spend-permissions/types").UseSpendPermissionOptions) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/sendUserOperation").SendUserOperationReturnType>;
    }>;
    createSmartAccount(name: string, ownerType: OwnerType, enableSpendPermissions?: boolean): Promise<{
        address: import("node_modules/@coinbase/cdp-sdk/_types/types/misc").Address;
        name?: string | undefined;
        owners: import("node_modules/@coinbase/cdp-sdk/_types/accounts/evm/types").EvmAccount[];
        type: "evm-smart";
        policies: string[] | undefined;
        useNetwork: <Network extends import("node_modules/@coinbase/cdp-sdk/_types/accounts/evm/types").KnownEvmNetworks>(network: Network) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/accounts/evm/types").NetworkScopedEvmSmartAccount<Network>>;
        listTokenBalances: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/listTokenBalances").ListTokenBalancesOptions, "address">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/listTokenBalances").ListTokenBalancesResult>;
        requestFaucet: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/requestFaucet").RequestFaucetOptions, "address">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/requestFaucet").RequestFaucetResult>;
        quoteFund: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/fund/quoteFund").EvmQuoteFundOptions, "address">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/Quote").EvmQuote>;
        fund: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/fund/fund").EvmFundOptions, "address">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/types").FundOperationResult>;
        waitForFundOperationReceipt: (options: import("node_modules/@coinbase/cdp-sdk/_types/actions/waitForFundOperationReceipt").WaitForFundOperationOptions) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/waitForFundOperationReceipt").WaitForFundOperationResult>;
        transfer: (options: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/transfer/types").SmartAccountTransferOptions) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/sendUserOperation").SendUserOperationReturnType>;
        sendUserOperation: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/sendUserOperation").SendUserOperationOptions<unknown[]>, "smartAccount">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/sendUserOperation").SendUserOperationReturnType>;
        waitForUserOperation: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/waitForUserOperation").WaitForUserOperationOptions, "smartAccountAddress">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/waitForUserOperation").WaitForUserOperationReturnType>;
        getUserOperation: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/client/evm/evm.types").GetUserOperationOptions, "smartAccount">) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/client/evm/evm.types").UserOperation>;
        quoteSwap: (options: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/swap/types").SmartAccountQuoteSwapOptions) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/swap/types").SmartAccountQuoteSwapResult>;
        swap: (options: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/swap/types").SmartAccountSwapOptions) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/swap/types").SmartAccountSwapResult>;
        signTypedData: (options: Omit<import("node_modules/@coinbase/cdp-sdk/_types/client/evm/evm.types").SignTypedDataOptions, "address"> & {
            network: import("node_modules/@coinbase/cdp-sdk/_types/accounts/evm/types").KnownEvmNetworks;
        }) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/types/misc").Hex>;
        useSpendPermission: (options: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/spend-permissions/types").UseSpendPermissionOptions) => Promise<import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/sendUserOperation").SendUserOperationReturnType>;
    }>;
    getBalances(ownerType: OwnerType, network?: NetworkType): Promise<{
        ownerType: OwnerType;
        ownerAddress: string;
        smartAccountAddress: `0x${string}`;
        eoaBalances: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/listTokenBalances").EvmTokenBalance[];
        smartAccountBalances: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/listTokenBalances").EvmTokenBalance[];
    }>;
    getAllBalances(network?: NetworkType): Promise<any[]>;
    requestFaucet(ownerType: OwnerType, token?: string, network?: NetworkType): Promise<{
        ownerType: OwnerType;
        smartAccountAddress: `0x${string}`;
        transactionHash: `0x${string}`;
        explorerUrl: string;
    }>;
    transfer(fromOwner: OwnerType, toAddress: string, amountWei: string, network?: NetworkType, usePaymaster?: boolean): Promise<{
        fromOwner: OwnerType;
        fromAddress: `0x${string}`;
        toAddress: string;
        amountWei: string;
        userOpHash: `0x${string}`;
        transactionHash: any;
        status: "failed" | "complete";
        usePaymaster: boolean;
        explorerUrl: string;
    }>;
    getSwapPrice(fromToken: string, toToken: string, fromAmountWei: string, takerAddress: string, network?: NetworkType): Promise<{
        fromToken: string;
        toToken: string;
        fromAmount: string;
        toAmount: any;
        minToAmount: any;
        liquidityAvailable: boolean;
        network: NetworkType;
    }>;
    executeSwap(ownerType: OwnerType, fromToken: string, toToken: string, fromAmountWei: string, slippageBps?: string, network?: NetworkType): Promise<{
        ownerType: OwnerType;
        smartAccountAddress: `0x${string}`;
        fromToken: string;
        toToken: string;
        fromAmount: string;
        toAmount: any;
        slippageBps: string;
        userOpHash: `0x${string}`;
        transactionHash: any;
        status: "failed" | "complete";
        explorerUrl: string;
    }>;
    validateSpendingLimit(spenderOwner: OwnerType, amountWei: string): boolean;
    formatEthAmount(amountWei: string): string;
}
