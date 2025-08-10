// CDP Configuration
export const CDP_CONFIG = {
  apiKeyId: '5c0be49f-a200-4c92-92f4-d272bd34c355',
  apiKeySecret: '5/P3B/FvTIGmwQCbJJjdXhMNtlDITA3cNZt3SsrwcnQhOTO1zDLcCJWbPf7y89O85RVeagHMM4HJSW36shEndw=='
};

// NEW Owner accounts (4 fresh accounts for 4 Smart Accounts)
export const OWNERS = {
  owner1: {
    privateKey: '23150f30df619418f8196f3b32959e04eb39cd4e30bd2f22e654dc8a33aae2d9',
    address: '0xC6d8c760D4Cf1faB0a6FEE5cA288511C62cd35eC'
  },
  owner2: {
    privateKey: '7eb3388f55de776b6156cc41269dc0d4a2a57247a386886331465d42b1804ac0',
    address: '0x02CB09ebC963BE3Ea99c9FBc0BD4A35a193a6bcF'
  },
  owner3: {
    privateKey: 'c804c35abd1212f14a874c830a2cfba6646cef72e99c367b0fc876a7be759e03',
    address: '0x0A95dE0848D5d4592224CC684671639E3881BF6e'
  },
  owner4: {
    privateKey: '2038c051dfcfead89e489c4092a0a1bed33b0977f9fe00c993ef58b86e46b9a9',
    address: '0xD2D08C830f8c153cfCA4E2Ee45684C562306948F'
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
  },
  owner3: {
    name: 'smart-account-3',
    address: '0x7481bB1D70e983b1DC8889242b909500Fa2A8C38'
  },
  owner4: {
    name: 'smart-account-4',
    address: '0x3EA7294ff093215f733Be3A1C6c761168F1bF216'
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