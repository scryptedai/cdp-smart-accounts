import {
  CdpClient,
  parseUnits,
} from "@coinbase/cdp-sdk";
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, NETWORKS } from './config.mjs';

async function createSpendPermissionSetup() {
  console.log('🔒 Creating Spend Permission Setup\n');

  const cdp = new CdpClient(CDP_CONFIG);

  console.log('🔧 Step 1: Creating Smart Accounts with Spend Permissions enabled...\n');

  // Create Smart Account 1 (Grantor) with spend permissions enabled
  const owner1Account = await cdp.evm.getOrCreateAccount({
    name: "spend-permission-owner-1",
  });

  const smartAccount1 = await cdp.evm.getOrCreateSmartAccount({
    name: "spend-permission-smart-account-1",
    owner: owner1Account,
    enableSpendPermissions: true, // CRITICAL: Must be enabled at creation
  });

  // Create Smart Account 2 (Spender)
  const owner2Account = await cdp.evm.getOrCreateAccount({
    name: "spend-permission-owner-2",
  });

  const smartAccount2 = await cdp.evm.getOrCreateSmartAccount({
    name: "spend-permission-smart-account-2",
    owner: owner2Account,
  });

  console.log('✅ Smart Account 1 (Grantor):', smartAccount1.address);
  console.log('✅ Smart Account 2 (Spender):', smartAccount2.address);

  // Request faucet funds for Smart Account 1
  console.log('\n💰 Requesting faucet funds for Smart Account 1...');
  try {
    const faucetResult = await cdp.evm.requestFaucet({
      address: smartAccount1.address,
      network: NETWORKS.testnet,
      token: 'eth'
    });
    console.log('✅ Faucet TX:', faucetResult.transactionHash);
  } catch (faucetErr) {
    console.log('⚠️ Faucet failed:', faucetErr.message);
  }

  console.log('\n🎯 Step 2: Creating Spend Permission...');
  console.log('   Limit: 0.00005 ETH (50% of expected 0.0001 ETH balance)');
  console.log('   Period: 1 day\n');

  // Define the spend permission
  const spendPermission = {
    account: smartAccount1.address,
    spender: smartAccount2.address,
    token: "eth", // Native ETH
    allowance: parseUnits("0.00005", 18), // 0.00005 ETH (18 decimals for ETH)
    periodInDays: 1,
  };

  try {
    console.log('📋 Creating spend permission...');
    const { userOpHash } = await cdp.evm.createSpendPermission({
      network: NETWORKS.testnet,
      spendPermission,
    });

    console.log('📋 User Operation Hash:', userOpHash);
    console.log('⏳ Waiting for confirmation...');

    const userOperationResult = await smartAccount1.waitForUserOperation({
      userOpHash,
    });

    console.log('✅ Spend permission created successfully!');
    console.log('📋 Result:', userOperationResult);

    // Now test the spend permission with a transaction that should fail
    await testSpendPermission(smartAccount1, smartAccount2, cdp);

  } catch (error) {
    console.error('❌ Spend permission creation failed:', error.message);
    console.log('\n💡 This might be because:');
    console.log('   • Spend permissions are not supported on Base Sepolia testnet');
    console.log('   • The Smart Account was not created with spend permissions enabled');
    console.log('   • There are insufficient funds for the user operation');
  }
}

async function testSpendPermission(grantor, spender, cdp) {
  console.log('\n🧪 Step 3: Testing Spend Permission with excessive amount...');
  
  const testAmount = parseUnits("0.1", 18); // 0.1 ETH - should exceed 0.00005 ETH limit
  const recipient = grantor.address; // Send back to grantor
  
  console.log(`   Attempting to spend: 0.1 ETH`);
  console.log(`   This exceeds the limit of: 0.00005 ETH`);
  console.log(`   Expected result: SHOULD FAIL\n`);

  try {
    // Attempt to use the spend permission to send more than allowed
    const { userOpHash } = await cdp.evm.useSpendPermission({
      network: NETWORKS.testnet,
      spender: spender.address,
      account: grantor.address,
      recipient: recipient,
      amount: testAmount,
      token: "eth"
    });

    console.log('❌ UNEXPECTED: Transaction was allowed!');
    console.log('📋 User Op Hash:', userOpHash);
    
    // Wait for confirmation
    const receipt = await spender.waitForUserOperation({
      userOpHash: userOpHash
    });
    
    console.log('Transaction Status:', receipt.status);

  } catch (spendError) {
    console.log('✅ EXPECTED: Transaction was rejected!');
    console.log('❌ Error:', spendError.message);
    console.log('🎉 Spend permission is working correctly - it blocked the excessive spend');
    
    // Now test with an amount within the limit
    await testValidSpend(grantor, spender, cdp);
  }
}

async function testValidSpend(grantor, spender, cdp) {
  console.log('\n🧪 Step 4: Testing with valid amount (0.00003 ETH - within limit)...');
  
  const validAmount = parseUnits("0.00003", 18); // 0.00003 ETH - within 0.00005 ETH limit
  const recipient = grantor.address;
  
  console.log(`   Attempting to spend: 0.00003 ETH`);
  console.log(`   This is within the limit of: 0.00005 ETH`);
  console.log(`   Expected result: SHOULD SUCCEED\n`);

  try {
    const { userOpHash } = await cdp.evm.useSpendPermission({
      network: NETWORKS.testnet,
      spender: spender.address,
      account: grantor.address,
      recipient: recipient,
      amount: validAmount,
      token: "eth"
    });

    console.log('✅ EXPECTED: Valid transaction was allowed!');
    console.log('📋 User Op Hash:', userOpHash);
    
    const receipt = await spender.waitForUserOperation({
      userOpHash: userOpHash
    });
    
    console.log('✅ Transaction Status:', receipt.status);
    console.log('🎉 Spend permission working correctly - valid spend succeeded');

  } catch (validSpendError) {
    console.log('❌ UNEXPECTED: Valid transaction was rejected!');
    console.log('Error:', validSpendError.message);
  }
}

createSpendPermissionSetup().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
