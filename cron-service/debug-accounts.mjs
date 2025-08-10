import { CdpClient } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';

async function debugAccounts() {
  console.log('🔍 Debug: Finding all smart accounts for Owner 2\n');

  const cdp = new CdpClient(CDP_CONFIG);
  const owner2Account = privateKeyToAccount('0x' + OWNERS.owner2.privateKey);

  console.log('👤 Owner 2 Address:', OWNERS.owner2.address);
  console.log('🔑 Owner 2 Private Key:', OWNERS.owner2.privateKey);

  // List all accounts to see what exists
  try {
    const accounts = await cdp.evm.listAccounts();
    console.log(`\n📋 Found ${accounts.length} total accounts:`);
    
    for (const account of accounts) {
      console.log(`   • ${account.name}: ${account.address}`);
      
      // Check if this account has funds
      try {
        const balanceResult = await cdp.evm.listTokenBalances({
          address: account.address,
          network: NETWORKS.testnet
        });
        
        const ethBalance = balanceResult.balances.find(b => 
          b.token.contractAddress === '0x0000000000000000000000000000000000000000' ||
          b.token.symbol === 'ETH'
        );
        
        const balance = ethBalance ? ethBalance.amount.amount : '0';
        const ethAmount = (Number(balance) / 1e18).toFixed(6);
        console.log(`     Balance: ${ethAmount} ETH`);
        
        // Check if this matches our expected funded account
        if (account.address === SMART_ACCOUNTS.owner2.address) {
          console.log(`     🎯 This matches our expected Owner 2 smart account!`);
        }
        
      } catch (balanceError) {
        console.log(`     Balance check failed: ${balanceError.message}`);
      }
    }
  } catch (error) {
    console.log('❌ Failed to list accounts:', error.message);
  }

  // Try different smart account names to find the right one
  const testNames = [
    'smart-account-2',
    'smart-account-1', 
    'smart-wallet-owner2',
    'smart-wallet-owner1'
  ];

  console.log('\n🧪 Testing different smart account names:');
  for (const name of testNames) {
    try {
      const smartAccount = await cdp.evm.getOrCreateSmartAccount({
        name: name,
        owner: owner2Account,
      });
      
      console.log(`✅ ${name}: ${smartAccount.address}`);
      
      if (smartAccount.address === SMART_ACCOUNTS.owner2.address) {
        console.log(`   🎯 FOUND THE RIGHT ONE! This matches our funded account!`);
        
        // Try a small transfer
        console.log('   🚀 Testing transfer with this account...');
        try {
          const transferAmount = parseUnits("0.00001", 18);
          const userOperation = await smartAccount.sendUserOperation({
            calls: [
              {
                to: SMART_ACCOUNTS.owner3.address,
                value: transferAmount,
                data: '0x',
              }
            ],
            network: NETWORKS.testnet,
          });
          console.log('   ✅ Transfer successful! User Op Hash:', userOperation.userOpHash);
          break;
        } catch (transferError) {
          console.log('   ❌ Transfer failed:', transferError.message);
        }
      }
      
    } catch (error) {
      if (error.message.includes('Multiple smart wallets')) {
        console.log(`❌ ${name}: Multiple smart wallets error (account exists with different owner)`);
      } else {
        console.log(`❌ ${name}: ${error.message}`);
      }
    }
  }
}

debugAccounts().catch((err) => {
  console.error('❌ Debug failed:', err);
  process.exit(1);
});
