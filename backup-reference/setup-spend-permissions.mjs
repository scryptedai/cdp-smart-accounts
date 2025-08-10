import { CdpClient } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';

async function setupSpendPermissions() {
  console.log('🔒 Setting up Spend Permissions between Smart Accounts\n');

  const cdp = new CdpClient(CDP_CONFIG);

  // Get both Smart Accounts
  const owner1Account = privateKeyToAccount('0x' + OWNERS.owner1.privateKey);
  const owner2Account = privateKeyToAccount('0x' + OWNERS.owner2.privateKey);

  try {
    // Get Smart Account 1 (the account that will grant permission)
    const smartAccount1 = await cdp.evm.getOrCreateSmartAccount({
      name: SMART_ACCOUNTS.owner1.name,
      owner: owner1Account,
    });

    // Get Smart Account 2 (the spender)
    const smartAccount2 = await cdp.evm.getOrCreateSmartAccount({
      name: SMART_ACCOUNTS.owner2.name,
      owner: owner2Account,
    });

    console.log('📍 Smart Account 1 (Grantor):', smartAccount1.address);
    console.log('📍 Smart Account 2 (Spender):', smartAccount2.address);
    
    // Define spend permission parameters
    const spendLimit = '50000000000000'; // 0.00005 ETH in wei (50% of 0.0001 ETH)
    const timePeriod = 86400; // 24 hours in seconds
    
    console.log(`\n🎯 Creating Spend Permission:`);
    console.log(`   Spender: ${smartAccount2.address}`);
    console.log(`   Token: ETH (native)`);
    console.log(`   Limit: 0.00005 ETH (${spendLimit} wei)`);
    console.log(`   Time Period: ${timePeriod} seconds (24 hours)\n`);

    // Create spend permission
    console.log('📋 Creating spend permission...');
    
    try {
      const spendPermission = await smartAccount1.createSpendPermission({
        spender: smartAccount2.address,
        token: '0x0000000000000000000000000000000000000000', // ETH (native token)
        amount: spendLimit,
        period: timePeriod,
        network: NETWORKS.testnet
      });

      console.log('✅ Spend Permission created!');
      console.log('📋 Permission ID:', spendPermission.id);
      
      // Now test with a transaction that exceeds the limit
      console.log('\n🧪 Testing spend permission with 0.1 ETH transaction (should fail)...');
      
      const testAmount = '100000000000000000'; // 0.1 ETH in wei (exceeds 0.00005 ETH limit)
      const recipient = owner1Account.address; // Send back to owner1's EOA
      
      console.log(`   Attempting to spend: 0.1 ETH (${testAmount} wei)`);
      console.log(`   This exceeds the limit of: 0.00005 ETH (${spendLimit} wei)`);
      console.log(`   Expected result: SHOULD FAIL\n`);

      try {
        // Attempt the transaction using Smart Account 2 with the spend permission
        const userOperation = await smartAccount2.sendUserOperation({
          calls: [
            {
              to: recipient,
              value: testAmount,
              data: '0x',
            },
          ],
          network: NETWORKS.testnet,
          useSpendPermission: spendPermission.id // Use the spend permission
        });

        console.log('❌ UNEXPECTED: Transaction was allowed!');
        console.log('📋 User Op Hash:', userOperation.userOpHash);
        
        // Wait for confirmation
        const receipt = await smartAccount2.waitForUserOperation({
          userOpHash: userOperation.userOpHash
        });
        
        console.log('Transaction Status:', receipt.status);

      } catch (spendError) {
        console.log('✅ EXPECTED: Transaction was rejected!');
        console.log('❌ Error:', spendError.message);
        console.log('🎉 Spend permission is working correctly - it blocked the excessive spend');
      }

    } catch (permissionError) {
      console.log('❌ Spend permission creation failed:', permissionError.message);
      
      if (permissionError.message.includes('not supported') || permissionError.message.includes('enabled')) {
        console.log('\n💡 Note: Spend Permissions must be enabled at Smart Account creation time');
        console.log('   Current Smart Accounts may not have this feature enabled');
        console.log('   Let\'s create new Smart Accounts with Spend Permissions enabled...\n');
        
        await createSmartAccountsWithSpendPermissions();
      }
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

async function createSmartAccountsWithSpendPermissions() {
  console.log('🔧 Creating new Smart Accounts with Spend Permissions enabled...');
  
  const cdp = new CdpClient(CDP_CONFIG);
  
  // Generate new owners for spend-permission-enabled accounts
  const { generatePrivateKey } = await import('viem/accounts');
  
  const newOwner1PK = generatePrivateKey();
  const newOwner2PK = generatePrivateKey();
  
  const newOwner1 = privateKeyToAccount(newOwner1PK);
  const newOwner2 = privateKeyToAccount(newOwner2PK);
  
  console.log('👤 New Owner 1:', newOwner1.address);
  console.log('👤 New Owner 2:', newOwner2.address);
  
  try {
    // Create Smart Accounts with spend permissions enabled
    const spSmartAccount1 = await cdp.evm.getOrCreateSmartAccount({
      name: 'spend-permission-account-1',
      owner: newOwner1,
      enableSpendPermissions: true // Enable spend permissions
    });
    
    const spSmartAccount2 = await cdp.evm.getOrCreateSmartAccount({
      name: 'spend-permission-account-2',
      owner: newOwner2,
      enableSpendPermissions: true // Enable spend permissions
    });
    
    console.log('✅ Smart Account 1 (with SP):', spSmartAccount1.address);
    console.log('✅ Smart Account 2 (with SP):', spSmartAccount2.address);
    
    // Request faucet funds for the new accounts
    console.log('\n💰 Requesting faucet funds...');
    try {
      const faucet1 = await cdp.evm.requestFaucet({
        address: spSmartAccount1.address,
        network: NETWORKS.testnet,
        token: 'eth'
      });
      console.log('✅ Faucet for Account 1:', faucet1.transactionHash);
    } catch (faucetErr) {
      console.log('⚠️ Faucet failed for Account 1:', faucetErr.message);
    }
    
    console.log('\n📝 Save these new account details:');
    console.log('Account 1:');
    console.log(`  Private Key: ${newOwner1PK.slice(2)}`);
    console.log(`  Owner Address: ${newOwner1.address}`);
    console.log(`  Smart Account: ${spSmartAccount1.address}`);
    console.log('Account 2:');
    console.log(`  Private Key: ${newOwner2PK.slice(2)}`);
    console.log(`  Owner Address: ${newOwner2.address}`);
    console.log(`  Smart Account: ${spSmartAccount2.address}`);
    
  } catch (createError) {
    console.log('❌ Failed to create spend-permission accounts:', createError.message);
  }
}

setupSpendPermissions().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
