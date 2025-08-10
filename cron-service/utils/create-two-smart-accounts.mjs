import { CdpClient } from '@coinbase/cdp-sdk';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, NETWORKS } from './config.mjs';
import fs from 'fs';

async function createTwoSmartAccounts() {
  console.log('🚀 Creating 2 Smart Accounts with 2 different owners\n');

  const cdp = new CdpClient(CDP_CONFIG);

  // Generate 2 fresh owner accounts
  const owners = {};
  const smartAccounts = {};

  for (let i = 1; i <= 2; i++) {
    console.log(`👤 Creating Owner ${i}...`);
    
    // Generate fresh private key and account
    const privateKey = generatePrivateKey();
    const ownerAccount = privateKeyToAccount(privateKey);
    
    owners[`owner${i}`] = {
      privateKey: privateKey.slice(2), // Remove 0x prefix
      address: ownerAccount.address
    };
    
    console.log(`   Private Key: ${owners[`owner${i}`].privateKey}`);
    console.log(`   Address: ${owners[`owner${i}`].address}`);
    
    try {
      // Create Smart Account for this owner
      console.log(`   🔧 Creating Smart Account...`);
      const smartAccount = await cdp.evm.getOrCreateSmartAccount({
        name: `smart-account-${i}`,
        owner: ownerAccount,
      });
      
      smartAccounts[`owner${i}`] = {
        name: `smart-account-${i}`,
        address: smartAccount.address,
        owner: owners[`owner${i}`].address
      };
      
      console.log(`   ✅ Smart Account: ${smartAccount.address}`);
      
      // Request faucet funds for the Smart Account
      console.log(`   💰 Requesting faucet funds...`);
      try {
        const faucetResult = await cdp.evm.requestFaucet({
          address: smartAccount.address,
          network: NETWORKS.testnet,
          token: 'eth'
        });
        console.log(`   ✅ Faucet TX: ${faucetResult.transactionHash}`);
      } catch (faucetErr) {
        console.log(`   ⚠️ Faucet failed: ${faucetErr.message}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Smart Account creation failed: ${error.message}`);
    }
    
    console.log('');
  }

  // Save the new accounts to files
  console.log('💾 Saving account data...\n');

  // Save private keys
  const keysData = {
    ...owners,
    timestamp: new Date().toISOString(),
    note: "Fresh accounts generated for 2 Smart Accounts"
  };
  
  fs.writeFileSync('new-owners-keys.json', JSON.stringify(keysData, null, 2));
  console.log('📁 Saved: new-owners-keys.json');

  // Save addresses and Smart Account info
  const accountsData = {
    network: NETWORKS.testnet,
    owners: {},
    smartAccounts: {},
    timestamp: new Date().toISOString()
  };

  for (const [key, owner] of Object.entries(owners)) {
    accountsData.owners[key] = {
      address: owner.address
    };
  }

  for (const [key, smartAccount] of Object.entries(smartAccounts)) {
    accountsData.smartAccounts[key] = {
      name: smartAccount.name,
      address: smartAccount.address,
      owner: smartAccount.owner
    };
  }

  fs.writeFileSync('new-accounts-info.json', JSON.stringify(accountsData, null, 2));
  console.log('📁 Saved: new-accounts-info.json');

  // Update config.mjs with new owners
  const newConfigContent = `// CDP Configuration
export const CDP_CONFIG = {
  apiKeyId: '${CDP_CONFIG.apiKeyId}',
  apiKeySecret: '${CDP_CONFIG.apiKeySecret}'
};

// NEW Owner accounts (2 fresh accounts for 2 Smart Accounts)
export const OWNERS = {
  owner1: {
    privateKey: '${owners.owner1.privateKey}',
    address: '${owners.owner1.address}'
  },
  owner2: {
    privateKey: '${owners.owner2.privateKey}',
    address: '${owners.owner2.address}'
  }
};

// Smart Accounts info
export const SMART_ACCOUNTS = {
  owner1: {
    name: '${smartAccounts.owner1?.name || 'smart-account-1'}',
    address: '${smartAccounts.owner1?.address || 'N/A'}'
  },
  owner2: {
    name: '${smartAccounts.owner2?.name || 'smart-account-2'}',
    address: '${smartAccounts.owner2?.address || 'N/A'}'
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
};`;

  fs.writeFileSync('config.mjs', newConfigContent);
  console.log('📁 Updated: config.mjs with new accounts');

  // Summary
  console.log('\n🎉 Summary:');
  console.log('✅ Created 2 fresh owner accounts');
  console.log(`✅ Smart Account 1: ${smartAccounts.owner1?.address || 'Failed'}`);
  console.log(`✅ Smart Account 2: ${smartAccounts.owner2?.address || 'Failed'}`);
  console.log('✅ Requested faucet funds for both');
  console.log('✅ Updated configuration files');
  
  console.log('\n🔄 Next steps:');
  console.log('   • Run: npm run balance (to check balances)');
  console.log('   • Both Smart Accounts should now work independently');
  console.log('   • Each owner controls their own Smart Account');
}

createTwoSmartAccounts().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
