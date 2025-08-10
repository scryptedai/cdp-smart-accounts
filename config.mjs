// CDP Configuration
export const CDP_CONFIG = {
  apiKeyId: '5c0be49f-a200-4c92-92f4-d272bd34c355',
  apiKeySecret: '5/P3B/FvTIGmwQCbJJjdXhMNtlDITA3cNZt3SsrwcnQhOTO1zDLcCJWbPf7y89O85RVeagHMM4HJSW36shEndw=='
};

// NEW Owner accounts (2 fresh accounts for 2 Smart Accounts)
export const OWNERS = {
  owner1: {
    privateKey: '0fe46a7a93c562805b00b07e3edcb8b4dd3347327951049a51ddacd45313a79d',
    address: '0x43451967B63410E569D0ea94d83AaE137d6Bca59'
  },
  owner2: {
    privateKey: '10a78fbc38fabec3cd7b22b3554e29a4d9fbe9b4acece1124a1fc069715d979b',
    address: '0xcbea75EF639963f02170A81f86469cc4710f13d3'
  }
};

// Smart Accounts info
export const SMART_ACCOUNTS = {
  owner1: {
    name: 'smart-account-1',
    address: '0x382d233262Fc9737188B6F6b2a25a24e05319F5E'
  },
  owner2: {
    name: 'smart-account-2',
    address: '0x55f7415B24eA71537d8E4b9Cb09Dc8244D36f231'
  }
};

// Network configuration
export const NETWORKS = {
  testnet: 'base-sepolia',
  mainnet: 'base'
};

// Token addresses for Base mainnet (for swaps)
export const TOKENS = {
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
};