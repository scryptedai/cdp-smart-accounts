import { CdpClient } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';

async function setSpendingLimit() {
  console.log('🔒 Setting spending limit policy on Smart Account 1\n');

  const cdp = new CdpClient(CDP_CONFIG);

  // Get the first Smart Account
  const owner1 = OWNERS.owner1;
  const ownerAccount = privateKeyToAccount('0x' + owner1.privateKey);

  try {
    // Get the Smart Account
    const smartAccount = await cdp.evm.getOrCreateSmartAccount({
      name: SMART_ACCOUNTS.owner1.name,
      owner: ownerAccount,
    });

    console.log('📍 Smart Account:', smartAccount.address);
    console.log('🎯 Setting spending limit: 0.00005 ETH (50,000 wei)\n');

    // Define the spending limit policy
    const spendingLimit = '50000000000000'; // 0.00005 ETH in wei
    const policyDefinition = {
      policy: {
        scope: "account",
        description: "Limit transactions to 0.00005 ETH (50% of balance)",
        rules: [
          {
            action: "reject",
            operation: "sendEvmTransaction",
            criteria: [
              {
                type: "ethValue",
                operator: ">",
                ethValue: spendingLimit
              }
            ]
          }
        ]
      }
    };

    console.log('📋 Policy Definition:');
    console.log(JSON.stringify(policyDefinition, null, 2));

    // Try to create and apply the policy
    try {
      console.log('\n🔧 Creating policy...');
      const newPolicy = await cdp.policies.createPolicy(policyDefinition);
      console.log('✅ Policy created with ID:', newPolicy.id);

      // Assign the policy to the Smart Account
      console.log('🔗 Assigning policy to Smart Account...');
      await cdp.policies.assignPolicyToAccount({
        accountId: smartAccount.id,
        policyId: newPolicy.id
      });

      console.log('✅ Policy successfully assigned!');
      console.log('\n🎉 Smart Account now has spending limit of 0.00005 ETH');
      console.log('   Any transaction above this amount will be rejected');

    } catch (policyError) {
      console.log('❌ Policy creation/assignment failed:', policyError.message);
      
      if (policyError.message.includes('not supported') || policyError.message.includes('policies')) {
        console.log('\n💡 Alternative approach: Manual transaction validation');
        console.log('   Since CDP policies might not be available, we can implement');
        console.log('   spending limit checks in the application layer');
        
        // Create a manual spending limit checker
        await createManualSpendingLimitChecker(smartAccount);
      }
    }

  } catch (error) {
    console.error('❌ Failed to set spending limit:', error.message);
  }
}

async function createManualSpendingLimitChecker(smartAccount) {
  console.log('\n🛠️ Creating manual spending limit checker...');
  
  // Create a spending limit validation function
  const spendingLimitWei = BigInt('50000000000000'); // 0.00005 ETH
  
  const validationScript = `
// Manual spending limit validation for Smart Account: ${smartAccount.address}
export const SPENDING_LIMIT_WEI = ${spendingLimitWei}n; // 0.00005 ETH

export function validateTransactionAmount(amountWei) {
  const amount = BigInt(amountWei);
  if (amount > SPENDING_LIMIT_WEI) {
    throw new Error(\`Transaction amount \${amount} wei exceeds spending limit of \${SPENDING_LIMIT_WEI} wei (0.00005 ETH)\`);
  }
  return true;
}

export function formatEthAmount(amountWei) {
  const amount = BigInt(amountWei);
  return (Number(amount) / 1e18).toFixed(6);
}

// Usage example:
// import { validateTransactionAmount } from './spending-limit-validator.mjs';
// validateTransactionAmount('60000000000000'); // This would throw an error
// validateTransactionAmount('40000000000000'); // This would pass
`;

  // Write the validation script
  const fs = await import('fs');
  fs.writeFileSync('spending-limit-validator.mjs', validationScript);
  
  console.log('✅ Created: spending-limit-validator.mjs');
  console.log('📋 This provides manual spending limit validation');
  console.log('   Import and use validateTransactionAmount() before sending transactions');
}

setSpendingLimit().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
