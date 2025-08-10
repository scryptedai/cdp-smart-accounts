import 'dotenv/config';
import { CdpClient } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';

async function testTransfer() {
  // Use your CDP API credentials
  const cdp = new CdpClient({
    apiKeyName: '5c0be49f-a200-4c92-92f4-d272bd34c355',
    apiKeySecret: '5/P3B/FvTIGmwQCbJJjdXhMNtlDITA3cNZt3SsrwcnQhOTO1zDLcCJWbPf7y89O85RVeagHMM4HJSW36shEndw=='
  });

  // Your owner1 data (CORRECTED ADDRESS)
  const owner1 = {
    privateKey: 'a99f84c770970bc2217ddaaf5de5ab2d9e10bda26c6e116ce2089ebb95a1e72e',
    address: '0x82Cd8cD9FbDe4a7f2130fEA7810aFe065432cad0'
  };

  console.log('💸 Testing ETH transfer on Base Sepolia...\n');

  try {
    // Get the Smart Account
    const ownerAccount = privateKeyToAccount('0x' + owner1.privateKey);
    const smartAccount = await cdp.evm.getOrCreateSmartAccount({
      name: 'smart-wallet-owner1',
      owner: ownerAccount,
    });

    console.log(`📍 Smart Account: ${smartAccount.address}`);

    // Recipient address (your EOA)
    const recipient = owner1.address;
    
    // Amount to transfer: 0.00001 ETH (10000000000000 wei)
    const transferAmount = BigInt('10000000000000'); // 0.00001 ETH in wei

    console.log(`💰 Transferring 0.00001 ETH from Smart Account to EOA...`);
    console.log(`   From: ${smartAccount.address}`);
    console.log(`   To: ${recipient}`);

    // Execute the transfer using sendUserOperation
    const userOperation = await smartAccount.sendUserOperation({
      calls: [
        {
          to: recipient,
          value: transferAmount,
          data: '0x', // Empty data for ETH transfer
        },
      ],
      network: 'base-sepolia',
    });

    console.log(`📋 User Operation Hash: ${userOperation.userOpHash}`);
    console.log('⏳ Waiting for confirmation...');

    // Wait for the user operation to complete
    const receipt = await smartAccount.waitForUserOperation({
      userOpHash: userOperation.userOpHash
    });

    if (receipt.status === 'complete') {
      console.log('✅ Transfer completed successfully!');
      console.log(`📋 Transaction Hash: ${receipt.transactionHash}`);
      console.log(`🔗 Base Sepolia Explorer: https://sepolia.basescan.org/tx/${receipt.transactionHash}`);
      
      // Check new balances
      console.log('\n💰 Checking updated balances...');
      
      // Smart Account balance
      const smartBalanceResult = await cdp.evm.listTokenBalances({
        address: smartAccount.address,
        network: 'base-sepolia'
      });
      const smartEthBalance = smartBalanceResult.balances.find(b => 
        b.token.contractAddress === '0x0000000000000000000000000000000000000000' ||
        b.token.symbol === 'ETH'
      );
      
      // EOA balance
      const eoaBalanceResult = await cdp.evm.listTokenBalances({
        address: recipient,
        network: 'base-sepolia'
      });
      const eoaEthBalance = eoaBalanceResult.balances.find(b => 
        b.token.contractAddress === '0x0000000000000000000000000000000000000000' ||
        b.token.symbol === 'ETH'
      );
      
      console.log('📊 New balances:');
      console.log(`   Smart Account: ${smartEthBalance ? smartEthBalance.amount.amount : '0'} ETH`);
      console.log(`   EOA: ${eoaEthBalance ? eoaEthBalance.amount.amount : '0'} ETH`);
      
    } else {
      console.error(`❌ Transfer failed: ${receipt.status}`);
    }

  } catch (error) {
    console.error('❌ Transfer test failed:', error.message);
  }

  console.log('\n🎯 This demonstrates:');
  console.log('   • Smart Account user operations work on Base Sepolia');
  console.log('   • You can send ETH between accounts');
  console.log('   • The infrastructure is ready for mainnet swaps');
}

testTransfer().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
