import { CdpService } from '../services/cdp.service';
import { TransferDto, SwapDto, FaucetRequestDto, BalanceQueryDto, SwapPriceDto, OwnerType, NetworkType } from '../dto/smart-wallet.dto';
export declare class SmartWalletController {
    private readonly cdpService;
    private readonly logger;
    constructor(cdpService: CdpService);
    getHealth(): {
        status: string;
        timestamp: string;
        service: string;
    };
    getBalances(query: BalanceQueryDto): Promise<any[] | {
        ownerType: OwnerType;
        ownerAddress: string;
        smartAccountAddress: `0x${string}`;
        eoaBalances: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/listTokenBalances").EvmTokenBalance[];
        smartAccountBalances: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/listTokenBalances").EvmTokenBalance[];
    }>;
    getBalancesByOwner(ownerType: OwnerType, network?: NetworkType): Promise<{
        ownerType: OwnerType;
        ownerAddress: string;
        smartAccountAddress: `0x${string}`;
        eoaBalances: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/listTokenBalances").EvmTokenBalance[];
        smartAccountBalances: import("node_modules/@coinbase/cdp-sdk/_types/actions/evm/listTokenBalances").EvmTokenBalance[];
    }>;
    requestFaucet(faucetDto: FaucetRequestDto): Promise<{
        ownerType: OwnerType;
        smartAccountAddress: `0x${string}`;
        transactionHash: `0x${string}`;
        explorerUrl: string;
    }>;
    transfer(transferDto: TransferDto): Promise<{
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
    getSwapPrice(swapPriceDto: SwapPriceDto): Promise<{
        fromToken: string;
        toToken: string;
        fromAmount: string;
        toAmount: any;
        minToAmount: any;
        liquidityAvailable: boolean;
        network: NetworkType;
    }>;
    executeSwap(swapDto: SwapDto): Promise<{
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
    validateSpendingLimit(body: {
        ownerType: OwnerType;
        amountWei: string;
    }): Promise<{
        valid: boolean;
        ownerType: OwnerType;
        amountWei: string;
        amountEth: string;
        spendingLimitWei: string;
        spendingLimitEth: string;
        error?: undefined;
    } | {
        valid: boolean;
        ownerType: OwnerType;
        amountWei: string;
        amountEth: string;
        spendingLimitWei: string;
        spendingLimitEth: string;
        error: any;
    }>;
    getConfig(): Promise<{
        networks: {
            testnet: string;
            mainnet: string;
        };
        tokens: {
            WETH: string;
            USDC: string;
        };
        spendingLimit: {
            wei: string;
            eth: string;
            description: string;
        };
        owners: string[];
        paymaster: {
            enabled: boolean;
            url: string;
        };
    }>;
    getSmartAccountInfo(): Promise<{
        owner1: {
            name: string;
            address: string;
            ownerAddress: string;
        };
        owner2: {
            name: string;
            address: string;
            ownerAddress: string;
        };
    }>;
    testSpendingLimit(): Promise<{
        summary: string;
        spendingLimit: {
            wei: string;
            eth: string;
        };
        tests: any[];
    }>;
}
