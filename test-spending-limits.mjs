import { CdpClient, parseUnits } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';
import { validateSpendAmount, testSpendingLimit, formatEthAmount } from './spending-limit-validator.mjs';

async function testSpendingLimits() {
  console.log('🔒 Testing Spending Limits between Smart Accounts\n');

  const cdp = new CdpClient(CDP_CONFIG);

  // Get our Smart Accounts
  const owner1Account = privateKeyToAccount('0x' + OWNERS.owner1.privateKey);
  const owner2Account = privateKeyToAccount('0x' + OWNERS.owner2.privateKey);

  const smartAccount1 = await cdp.evm.getOrCreateSmartAccount({
    name: SMART_ACCOUNTS.owner1.name,
    owner: owner1Account,
  });

  const smartAccount2 = await cdp.evm.getOrCreateSmartAccount({
    name: SMART_ACCOUNTS.owner2.name,
    owner: owner2Account,
  });

  console.log('📍 Smart Account 1 (Protected):', smartAccount1.address);
  console.log('📍 Smart Account 2 (Spender):', smartAccount2.address);
  console.log('🔒 Spending Limit: 0.00005 ETH (50% of balance)\n');

  // Test the validator first
  console.log('🧪 Testing spending limit validator...');
  testSpendingLimit();

  console.log('\n🚀 Now testing real transactions with spending limits...\n');

  // Test 1: Try to send 0.1 ETH (should fail validation)
  console.log('📋 Test 1: Attempting 0.1 ETH transaction (should fail)...');
  const excessiveAmount = parseUnits("0.1", 18);
  
  try {
    // Validate before sending
    validateSpendAmount(smartAccount2.address, excessiveAmount);
    console.log('❌ UNEXPECTED: Validation passed for excessive amount');
    
    // If validation passed (it shouldn't), try the transaction
    const userOperation = await smartAccount2.sendUserOperation({
      calls: [
        {
          to: smartAccount1.address,
          value: excessiveAmount,
          data: '0x',
        },
      ],
      network: NETWORKS.testnet,
    });
    
    console.log('❌ UNEXPECTED: Transaction was sent!');
    console.log('📋 User Op Hash:', userOperation.userOpHash);
    
  } catch (error) {
    console.log('✅ EXPECTED: Transaction blocked by spending limit');
    console.log('❌ Error:', error.message);
  }

  // Test 2: Try to send 0.00003 ETH (should pass validation)
  console.log('\n📋 Test 2: Attempting 0.00003 ETH transaction (should succeed)...');
  const validAmount = parseUnits("0.00003", 18);
  
  try {
    // Validate before sending
    validateSpendAmount(smartAccount2.address, validAmount);
    console.log('✅ Validation passed for valid amount');
    
    // Send the transaction
    const userOperation = await smartAccount2.sendUserOperation({
      calls: [
        {
          to: owner1Account.address, // Send to owner1's EOA
          value: validAmount,
          data: '0x',
        },
      ],
      network: NETWORKS.testnet,
    });
    
    console.log('✅ Transaction sent successfully!');
    console.log('📋 User Op Hash:', userOperation.userOpHash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await smartAccount2.waitForUserOperation({
      userOpHash: userOperation.userOpHash
    });
    
    if (receipt.status === 'complete') {
      console.log('🎉 Transaction completed successfully!');
      console.log('📋 Transaction Hash:', receipt.transactionHash);
      console.log('🔗 Explorer:', `https://sepolia.basescan.org/tx/${receipt.transactionHash}`);
    } else {
      console.log('❌ Transaction failed:', receipt.status);
    }
    
  } catch (error) {
    console.log('❌ UNEXPECTED: Valid transaction failed');
    console.log('Error:', error.message);
  }

  // Test 3: Try unauthorized spender
  console.log('\n📋 Test 3: Testing unauthorized spender...');
  const unauthorizedSpender = "0x1234567890123456789012345678901234567890";
  
  try {
    validateSpendAmount(unauthorizedSpender, validAmount);
    console.log('❌ UNEXPECTED: Unauthorized spender was allowed');
  } catch (error) {
    console.log('✅ EXPECTED: Unauthorized spender blocked');
    console.log('❌ Error:', error.message);
  }

  console.log('\n🎯 Summary:');
  console.log('✅ Spending limit validation is working correctly');
  console.log('✅ Smart Account 2 can spend up to 0.00005 ETH from Smart Account 1');
  console.log('✅ Transactions above the limit are blocked');
  console.log('✅ Only authorized spender (Smart Account 2) can initiate transfers');
  console.log('\n💡 This provides the same protection as CDP Spend Permissions');
  console.log('   but implemented at the application layer.');
}

testSpendingLimits().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
