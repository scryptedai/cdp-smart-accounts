import { CdpClient, parseUnits } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';

async function testFreshTransfer() {
  console.log('🧪 Testing fresh transfer with current config\n');

  const cdp = new CdpClient(CDP_CONFIG);

  // Get accounts
  const owner2Account = privateKeyToAccount('0x' + OWNERS.owner2.privateKey);

  console.log('👤 Owner 2 Address:', OWNERS.owner2.address);
  console.log('🔑 Owner 2 Private Key:', OWNERS.owner2.privateKey);

  // Create a fresh smart account for Owner 2
  const smartAccount2 = await cdp.evm.getOrCreateSmartAccount({
    name: `test-fresh-${Date.now()}`,
    owner: owner2Account,
  });

  console.log('📍 Fresh Smart Account 2:', smartAccount2.address);
  console.log('📍 Expected Smart Account 2:', SMART_ACCOUNTS.owner2.address);

  // Check balance
  const balanceResult = await cdp.evm.listTokenBalances({
    address: smartAccount2.address,
    network: NETWORKS.testnet
  });
  
  const ethBalance = balanceResult.balances.find(b => 
    b.token.contractAddress === '0x0000000000000000000000000000000000000000' ||
    b.token.symbol === 'ETH'
  );
  
  const currentBalance = BigInt(ethBalance ? ethBalance.amount.amount : '0');
  console.log(`💰 Fresh Smart Account Balance: ${(Number(currentBalance) / 1e18).toFixed(6)} ETH`);

  if (currentBalance > 0n) {
    console.log('\n🚀 Testing transfer from fresh account...');
    const transferAmount = parseUnits("0.00001", 18);
    
    try {
      const userOperation = await smartAccount2.sendUserOperation({
        calls: [
          {
            to: SMART_ACCOUNTS.owner3.address,
            value: transferAmount,
            data: '0x',
          }
        ],
        network: NETWORKS.testnet,
      });

      console.log('✅ Transfer successful!');
      console.log('📋 User Operation Hash:', userOperation.userOpHash);
      
    } catch (error) {
      console.log('❌ Transfer failed:', error.message);
    }
  } else {
    console.log('⚠️ Fresh account has no balance - this is expected');
  }
}

testFreshTransfer().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
