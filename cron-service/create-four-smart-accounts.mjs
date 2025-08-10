import { CdpClient } from '@coinbase/cdp-sdk';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, NETWORKS } from './config.mjs';
import fs from 'fs';

async function createFourSmartAccounts() {
  console.log('🚀 Creating 4 Smart Accounts with 4 different owners\n');

  const cdp = new CdpClient(CDP_CONFIG);

  // Generate 4 fresh owner accounts
  const owners = {};
  const smartAccounts = {};

  for (let i = 1; i <= 4; i++) {
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
        console.log(`   🔗 Explorer: https://sepolia.basescan.org/tx/${faucetResult.transactionHash}`);
      } catch (faucetErr) {
        console.log(`   ⚠️ Faucet failed: ${faucetErr.message}`);
        console.log(`   💡 You can manually fund this account: ${smartAccount.address}`);
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
    note: "Fresh accounts generated for 4 Smart Accounts"
  };
  
  fs.writeFileSync('four-owners-keys.json', JSON.stringify(keysData, null, 2));
  console.log('📁 Saved: four-owners-keys.json');

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

  fs.writeFileSync('four-accounts-info.json', JSON.stringify(accountsData, null, 2));
  console.log('📁 Saved: four-accounts-info.json');

  // Update config.mjs with new owners
  const newConfigContent = `// CDP Configuration
export const CDP_CONFIG = {
  apiKeyId: '${CDP_CONFIG.apiKeyId}',
  apiKeySecret: '${CDP_CONFIG.apiKeySecret}'
};

// NEW Owner accounts (4 fresh accounts for 4 Smart Accounts)
export const OWNERS = {
  owner1: {
    privateKey: '${owners.owner1.privateKey}',
    address: '${owners.owner1.address}'
  },
  owner2: {
    privateKey: '${owners.owner2.privateKey}',
    address: '${owners.owner2.address}'
  },
  owner3: {
    privateKey: '${owners.owner3.privateKey}',
    address: '${owners.owner3.address}'
  },
  owner4: {
    privateKey: '${owners.owner4.privateKey}',
    address: '${owners.owner4.address}'
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
  },
  owner3: {
    name: '${smartAccounts.owner3?.name || 'smart-account-3'}',
    address: '${smartAccounts.owner3?.address || 'N/A'}'
  },
  owner4: {
    name: '${smartAccounts.owner4?.name || 'smart-account-4'}',
    address: '${smartAccounts.owner4?.address || 'N/A'}'
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
  console.log('📁 Updated: config.mjs with new 4 accounts');

  // Summary
  console.log('\n🎉 Summary:');
  console.log('✅ Created 4 fresh owner accounts');
  console.log(`✅ Smart Account 1: ${smartAccounts.owner1?.address || 'Failed'}`);
  console.log(`✅ Smart Account 2: ${smartAccounts.owner2?.address || 'Failed'}`);
  console.log(`✅ Smart Account 3: ${smartAccounts.owner3?.address || 'Failed'}`);
  console.log(`✅ Smart Account 4: ${smartAccounts.owner4?.address || 'Failed'}`);
  console.log('✅ Requested faucet funds for all 4');
  console.log('✅ Updated configuration files');
  
  console.log('\n🔄 Next steps:');
  console.log('   • Run: npm run balance (to check balances)');
  console.log('   • All 4 Smart Accounts should now work independently');
  console.log('   • Each owner controls their own Smart Account');
  console.log('   • You can set up spending permissions between any accounts');
  
  console.log('\n💡 Account Structure:');
  console.log('   Owner 1 ↔ Smart Account 1');
  console.log('   Owner 2 ↔ Smart Account 2');
  console.log('   Owner 3 ↔ Smart Account 3');
  console.log('   Owner 4 ↔ Smart Account 4');
}

createFourSmartAccounts().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
