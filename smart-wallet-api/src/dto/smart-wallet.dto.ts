import { IsString, IsOptional, IsNumberString, IsEnum, IsBoolean } from 'class-validator';

export enum NetworkType {
  TESTNET = 'base-sepolia',
  MAINNET = 'base'
}

export enum OwnerType {
  OWNER1 = 'owner1',
  OWNER2 = 'owner2'
}

export class CreateSmartAccountDto {
  @IsString()
  name: string;

  @IsEnum(OwnerType)
  ownerType: OwnerType;

  @IsOptional()
  @IsBoolean()
  enableSpendPermissions?: boolean;
}

export class TransferDto {
  @IsEnum(OwnerType)
  fromOwner: OwnerType;

  @IsString()
  toAddress: string;

  @IsNumberString()
  amountWei: string;

  @IsOptional()
  @IsEnum(NetworkType)
  network?: NetworkType = NetworkType.TESTNET;

  @IsOptional()
  @IsBoolean()
  usePaymaster?: boolean = false;
}

export class SwapDto {
  @IsEnum(OwnerType)
  ownerType: OwnerType;

  @IsString()
  fromToken: string;

  @IsString()
  toToken: string;

  @IsNumberString()
  fromAmountWei: string;

  @IsOptional()
  @IsNumberString()
  slippageBps?: string = '100'; // 1% default

  @IsOptional()
  @IsEnum(NetworkType)
  network?: NetworkType = NetworkType.MAINNET;
}

export class SpendingLimitDto {
  @IsEnum(OwnerType)
  grantorOwner: OwnerType;

  @IsEnum(OwnerType)
  spenderOwner: OwnerType;

  @IsNumberString()
  limitWei: string;

  @IsOptional()
  @IsNumberString()
  periodInDays?: string = '1';
}

export class FaucetRequestDto {
  @IsEnum(OwnerType)
  ownerType: OwnerType;

  @IsOptional()
  @IsString()
  token?: string = 'eth';

  @IsOptional()
  @IsEnum(NetworkType)
  network?: NetworkType = NetworkType.TESTNET;
}

export class BalanceQueryDto {
  @IsOptional()
  @IsEnum(OwnerType)
  ownerType?: OwnerType;

  @IsOptional()
  @IsEnum(NetworkType)
  network?: NetworkType = NetworkType.TESTNET;
}

export class SwapPriceDto {
  @IsString()
  fromToken: string;

  @IsString()
  toToken: string;

  @IsNumberString()
  fromAmountWei: string;

  @IsString()
  takerAddress: string;

  @IsOptional()
  @IsEnum(NetworkType)
  network?: NetworkType = NetworkType.MAINNET;
}
