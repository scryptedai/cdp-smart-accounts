import { CdpClient, parseUnits } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';

async function minimalTransferTest() {
  console.log('💸 Minimal Transfer Test\n');

  const CDP_CONFIG = {
    apiKeyId: '5c0be49f-a200-4c92-92f4-d272bd34c355',
    apiKeySecret: '5/P3B/FvTIGmwQCbJJjdXhMNtlDITA3cNZt3SsrwcnQhOTO1zDLcCJWbPf7y89O85RVeagHMM4HJSW36shEndw=='
  };

  const cdp = new CdpClient(CDP_CONFIG);

  // Use the exact private key that worked in debug
  const owner2PrivateKey = '17216a0d83fa3ba96145b867922e58fe977469fd9e19ef6a0e67f4a1d9e8d2af';
  const owner2Account = privateKeyToAccount('0x' + owner2PrivateKey);

  console.log('👤 Owner 2 Address:', owner2Account.address);

  // Get the smart account using the exact name that worked
  const smartAccount2 = await cdp.evm.getOrCreateSmartAccount({
    name: 'smart-account-2',
    owner: owner2Account,
  });

  console.log('📍 Smart Account 2:', smartAccount2.address);

  // Check balance
  const balanceResult = await cdp.evm.listTokenBalances({
    address: smartAccount2.address,
    network: 'base-sepolia'
  });
  
  const ethBalance = balanceResult.balances.find(b => 
    b.token.contractAddress === '0x0000000000000000000000000000000000000000' ||
    b.token.symbol === 'ETH'
  );
  
  const currentBalance = BigInt(ethBalance ? ethBalance.amount.amount : '0');
  console.log(`💰 Current Balance: ${(Number(currentBalance) / 1e18).toFixed(6)} ETH`);

  if (currentBalance > parseUnits("0.00001", 18)) {
    console.log('\n🚀 Executing minimal transfer: 0.00001 ETH...');
    const transferAmount = parseUnits("0.00001", 18);
    
    try {
      const userOperation = await smartAccount2.sendUserOperation({
        calls: [
          {
            to: '0x7481bB1D70e983b1DC8889242b909500Fa2A8C38', // Owner 3 address
            value: transferAmount,
            data: '0x',
          }
        ],
        network: 'base-sepolia',
      });

      console.log('✅ Transfer successful!');
      console.log('📋 User Operation Hash:', userOperation.userOpHash);
      
      const receipt = await smartAccount2.waitForUserOperation({
        userOpHash: userOperation.userOpHash
      });

      if (receipt.status === 'complete') {
        console.log('🎉 Transfer completed!');
        console.log('📋 Transaction Hash:', receipt.transactionHash);
        console.log('🔗 Explorer:', `https://sepolia.basescan.org/tx/${receipt.transactionHash}`);
      }
      
    } catch (error) {
      console.log('❌ Transfer failed:', error.message);
    }
  } else {
    console.log('⚠️ Insufficient balance for transfer');
  }
}

minimalTransferTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
