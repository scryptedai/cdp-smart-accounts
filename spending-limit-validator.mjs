// Manual Spending Limit Validator for Smart Account: 0x382d233262Fc9737188B6F6b2a25a24e05319F5E
import { parseUnits } from "@coinbase/cdp-sdk";

export const SPENDING_LIMIT = parseUnits("0.00005", 18); // 0.00005 ETH
export const GRANTOR_ADDRESS = "0x382d233262Fc9737188B6F6b2a25a24e05319F5E";
export const AUTHORIZED_SPENDER = "0x55f7415B24eA71537d8E4b9Cb09Dc8244D36f231";

export function validateSpendAmount(spenderAddress, amountWei) {
  // Check if spender is authorized
  if (spenderAddress.toLowerCase() !== AUTHORIZED_SPENDER.toLowerCase()) {
    throw new Error(`Unauthorized spender: ${spenderAddress}`);
  }
  
  // Check if amount exceeds limit
  const amount = BigInt(amountWei);
  if (amount > SPENDING_LIMIT) {
    throw new Error(
      `Amount ${amount} wei exceeds spending limit of ${SPENDING_LIMIT} wei (0.00005 ETH)`
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
  
  try {
    // Test unauthorized spender
    validateSpendAmount("0x1234567890123456789012345678901234567890", validAmount);
    console.log('❌ Unauthorized spender - SHOULD HAVE FAILED');
  } catch (err) {
    console.log('✅ Unauthorized spender - CORRECTLY BLOCKED:', err.message);
  }
}
