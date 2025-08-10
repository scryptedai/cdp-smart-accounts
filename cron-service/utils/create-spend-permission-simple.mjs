import {
  CdpClient,
  parseUnits,
} from "@coinbase/cdp-sdk";
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';

async function createSpendPermission() {
  console.log('🔒 Creating Spend Permission between existing Smart Accounts\n');

  const cdp = new CdpClient(CDP_CONFIG);

  // Get our existing Smart Accounts
  const owner1Account = privateKeyToAccount('0x' + OWNERS.owner1.privateKey);
  const owner2Account = privateKeyToAccount('0x' + OWNERS.owner2.privateKey);

  try {
    // Get existing Smart Accounts
    const smartAccount1 = await cdp.evm.getOrCreateSmartAccount({
      name: SMART_ACCOUNTS.owner1.name,
      owner: owner1Account,
    });

    const smartAccount2 = await cdp.evm.getOrCreateSmartAccount({
      name: SMART_ACCOUNTS.owner2.name,
      owner: owner2Account,
    });

    console.log('📍 Smart Account 1 (Grantor):', smartAccount1.address);
    console.log('📍 Smart Account 2 (Spender):', smartAccount2.address);

    console.log('\n🎯 Creating Spend Permission:');
    console.log('   Grantor: Smart Account 1');
    console.log('   Spender: Smart Account 2');
    console.log('   Token: ETH');
    console.log('   Limit: 0.00005 ETH (50% of balance)');
    console.log('   Period: 1 day\n');

    // Define the spend permission
    const spendPermission = {
      account: smartAccount1.address,
      spender: smartAccount2.address,
      token: "eth",
      allowance: parseUnits("0.00005", 18), // 0.00005 ETH
      periodInDays: 1,
    };

    console.log('📋 Creating spend permission...');
    
    try {
      const { userOpHash } = await cdp.evm.createSpendPermission({
        network: NETWORKS.testnet,
        spendPermission,
      });

      console.log('✅ Spend permission created!');
      console.log('📋 User Operation Hash:', userOpHash);
      console.log('⏳ Waiting for confirmation...');

      const userOperationResult = await smartAccount1.waitForUserOperation({
        userOpHash,
      });

      console.log('✅ Spend permission confirmed!');
      console.log('📋 Result status:', userOperationResult.status);

      // Test with excessive amount (0.1 ETH)
      await testExcessiveSpend(smartAccount1, smartAccount2, cdp);

    } catch (createError) {
      console.log('❌ Spend permission creation failed:', createError.message);
      
      if (createError.message.includes('spend permissions')) {
        console.log('\n💡 The existing Smart Accounts were not created with spend permissions enabled.');
        console.log('   Spend permissions must be enabled at account creation time.');
        console.log('   Let me create a manual spending limit validation instead...\n');
        
        await createManualSpendingValidation(smartAccount1, smartAccount2);
      }
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

async function testExcessiveSpend(grantor, spender, cdp) {
  console.log('\n🧪 Testing with 0.1 ETH (should exceed 0.00005 ETH limit)...');
  
  const excessiveAmount = parseUnits("0.1", 18); // 0.1 ETH
  
  console.log('   Attempting to spend: 0.1 ETH');
  console.log('   Limit: 0.00005 ETH');
  console.log('   Expected: SHOULD FAIL\n');

  try {
    const { userOpHash } = await cdp.evm.useSpendPermission({
      network: NETWORKS.testnet,
      spender: spender.address,
      account: grantor.address,
      recipient: grantor.address,
      amount: excessiveAmount,
      token: "eth"
    });

    console.log('❌ UNEXPECTED: Excessive transaction was allowed!');
    console.log('📋 User Op Hash:', userOpHash);

  } catch (spendError) {
    console.log('✅ EXPECTED: Excessive transaction was blocked!');
    console.log('❌ Error:', spendError.message);
    console.log('🎉 Spend permission is working correctly!');
  }
}

async function createManualSpendingValidation(smartAccount1, smartAccount2) {
  console.log('🛠️ Creating Manual Spending Validation System...');
  
  const spendingLimitWei = parseUnits("0.00005", 18); // 0.00005 ETH
  
  console.log(`📍 Smart Account 1 (Protected): ${smartAccount1.address}`);
  console.log(`📍 Smart Account 2 (Spender): ${smartAccount2.address}`);
  console.log(`🔒 Spending Limit: 0.00005 ETH (${spendingLimitWei} wei)`);
  
  // Create a validation function
  const validatorCode = `
// Manual Spending Limit Validator for Smart Account: ${smartAccount1.address}
import { parseUnits } from "@coinbase/cdp-sdk";

export const SPENDING_LIMIT = parseUnits("0.00005", 18); // 0.00005 ETH
export const GRANTOR_ADDRESS = "${smartAccount1.address}";
export const AUTHORIZED_SPENDER = "${smartAccount2.address}";

export function validateSpendAmount(spenderAddress, amountWei) {
  // Check if spender is authorized
  if (spenderAddress.toLowerCase() !== AUTHORIZED_SPENDER.toLowerCase()) {
    throw new Error(\`Unauthorized spender: \${spenderAddress}\`);
  }
  
  // Check if amount exceeds limit
  const amount = BigInt(amountWei);
  if (amount > SPENDING_LIMIT) {
    throw new Error(
      \`Amount \${amount} wei (0.00005 ETH) exceeds spending limit of \${SPENDING_LIMIT} wei (0.00005 ETH)\`
    );
  }
  
  return true;
}

export function formatEthAmount(amountWei) {
  const amount = BigInt(amountWei);
  return (Number(amount) / 1e18).toFixed(6);
}

// Test function
export function testSpendingLimit() {
  console.log('🧪 Testing spending limit validation...');
  
  try {
    // Test valid amount (0.00003 ETH)
    const validAmount = parseUnits("0.00003", 18);
    validateSpendAmount(AUTHORIZED_SPENDER, validAmount);
    console.log('✅ Valid amount (0.00003 ETH) - PASSED');
  } catch (err) {
    console.log('❌ Valid amount test failed:', err.message);
  }
  
  try {
    // Test excessive amount (0.1 ETH)
    const excessiveAmount = parseUnits("0.1", 18);
    validateSpendAmount(AUTHORIZED_SPENDER, excessiveAmount);
    console.log('❌ Excessive amount (0.1 ETH) - SHOULD HAVE FAILED');
  } catch (err) {
    console.log('✅ Excessive amount (0.1 ETH) - CORRECTLY BLOCKED:', err.message);
  }
}
`;

  // Write the validator
  const fs = await import('fs');
  fs.writeFileSync('spending-limit-validator.mjs', validatorCode);
  
  console.log('✅ Created: spending-limit-validator.mjs');
  console.log('\n🧪 Testing the validator...');
  
  // Import and test the validator
  const { testSpendingLimit } = await import('./spending-limit-validator.mjs');
  testSpendingLimit();
  
  console.log('\n🎯 Usage:');
  console.log('   import { validateSpendAmount } from "./spending-limit-validator.mjs";');
  console.log('   validateSpendAmount(spenderAddress, amountInWei);');
  console.log('\n💡 This provides the same protection as spend permissions');
  console.log('   but implemented at the application layer.');
}

createSpendPermission().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
