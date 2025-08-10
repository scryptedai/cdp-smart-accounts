import { CdpClient, parseUnits } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';

async function simpleTransferTest() {
  console.log('💸 Simple Transfer Test: Direct transfer from funded account\n');

  const cdp = new CdpClient(CDP_CONFIG);

  // Try to get the existing smart account by using the exact name from when it was created
  const owner2Account = privateKeyToAccount('0x' + OWNERS.owner2.privateKey);
  
  // The original smart account was created with name "smart-account-2"
  const smartAccount2 = await cdp.evm.getOrCreateSmartAccount({
    name: 'smart-account-2', // Use the exact original name
    owner: owner2Account,
  });

  console.log('📍 Smart Account 2:', smartAccount2.address);
  console.log('📍 Expected:', SMART_ACCOUNTS.owner2.address);
  console.log('✅ Addresses match:', smartAccount2.address === SMART_ACCOUNTS.owner2.address);

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
  console.log(`💰 Current Balance: ${(Number(currentBalance) / 1e18).toFixed(6)} ETH`);

  if (currentBalance > parseUnits("0.00002", 18)) {
    console.log('\n🚀 Executing transfer: 0.00001 ETH to Owner 3 and Owner 4...');
    const transferAmount = parseUnits("0.00001", 18);
    
    try {
      const userOperation = await smartAccount2.sendUserOperation({
        calls: [
          {
            to: SMART_ACCOUNTS.owner3.address,
            value: transferAmount,
            data: '0x',
          },
          {
            to: SMART_ACCOUNTS.owner4.address,
            value: transferAmount,
            data: '0x',
          }
        ],
        network: NETWORKS.testnet,
      });

      console.log('✅ Batch transfer initiated!');
      console.log('📋 User Operation Hash:', userOperation.userOpHash);
      console.log('⏳ Waiting for confirmation...');

      const receipt = await smartAccount2.waitForUserOperation({
        userOpHash: userOperation.userOpHash
      });

      if (receipt.status === 'complete') {
        console.log('🎉 Transfer completed successfully!');
        console.log('📋 Transaction Hash:', receipt.transactionHash);
        console.log('🔗 Explorer:', `https://sepolia.basescan.org/tx/${receipt.transactionHash}`);
        console.log('✅ Owner 3 received: 0.00001 ETH');
        console.log('✅ Owner 4 received: 0.00001 ETH');
      } else {
        console.log('❌ Transfer failed:', receipt.status);
      }
      
    } catch (error) {
      console.log('❌ Transfer failed:', error.message);
    }
  } else {
    console.log('⚠️ Insufficient balance for transfers');
  }
}

simpleTransferTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
