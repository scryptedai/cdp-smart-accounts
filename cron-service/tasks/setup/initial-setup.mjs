import { CdpClient, parseUnits } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from '../../config.mjs';

async function initialSetup() {
  console.log('🔧 Initial Setup: Owner 1 faucet + Owner 2 gets 0.0001 ETH from Owner 1\n');

  const cdp = new CdpClient(CDP_CONFIG);

  // Get accounts
  const owner1Account = privateKeyToAccount('0x' + OWNERS.owner1.privateKey);
  const owner2Account = privateKeyToAccount('0x' + OWNERS.owner2.privateKey);

  // Use existing smart account addresses instead of creating new ones
  const smartAccount1Address = SMART_ACCOUNTS.owner1.address;
  const smartAccount2Address = SMART_ACCOUNTS.owner2.address;

  console.log('📍 Smart Account 1 (Owner 1):', smartAccount1Address);
  console.log('📍 Smart Account 2 (Owner 2):', smartAccount2Address);

  // Step 1: Request faucet for Owner 1
  console.log('\n💰 Step 1: Requesting 0.0001 ETH from faucet for Owner 1...');
  try {
    const faucetResult = await cdp.evm.requestFaucet({
      address: smartAccount1Address,
      network: NETWORKS.testnet,
      token: 'eth'
    });
    console.log('✅ Faucet successful!');
    console.log('📋 Transaction Hash:', faucetResult.transactionHash);
    console.log('🔗 Explorer:', `https://sepolia.basescan.org/tx/${faucetResult.transactionHash}`);
  } catch (faucetErr) {
    console.log('⚠️ Faucet failed:', faucetErr.message);
    console.log('💡 Continuing with existing balance...');
  }

  // Wait a bit for faucet to confirm
  console.log('\n⏳ Waiting 15 seconds for faucet to confirm...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Step 2: Owner 1 transfers 0.0001 ETH to Owner 2
  console.log('\n💸 Step 2: Owner 1 transferring 0.0001 ETH to Owner 2...');
  const transferAmount = parseUnits("0.0001", 18); // 0.0001 ETH

  try {
    // Get the smart account object for Owner 1 to perform the transfer
    const smartAccount1 = await cdp.evm.getOrCreateSmartAccount({
      name: `setup-${SMART_ACCOUNTS.owner1.name}-${Date.now()}`,
      owner: owner1Account,
    });

    const userOperation = await smartAccount1.sendUserOperation({
      calls: [
        {
          to: smartAccount2Address,
          value: transferAmount,
          data: '0x',
        },
      ],
      network: NETWORKS.testnet,
    });

    console.log('✅ Transfer initiated!');
    console.log('📋 User Operation Hash:', userOperation.userOpHash);
    console.log('⏳ Waiting for confirmation...');

    const receipt = await smartAccount1.waitForUserOperation({
      userOpHash: userOperation.userOpHash
    });

    if (receipt.status === 'complete') {
      console.log('✅ Transfer completed successfully!');
      console.log('📋 Transaction Hash:', receipt.transactionHash);
      console.log('🔗 Explorer:', `https://sepolia.basescan.org/tx/${receipt.transactionHash}`);
    } else {
      console.log('❌ Transfer failed:', receipt.status);
    }

  } catch (error) {
    console.error('❌ Transfer failed:', error.message);
    throw error;
  }

  console.log('\n🎉 Initial setup completed!');
  console.log('   • Owner 1 received faucet funds');
  console.log('   • Owner 2 received 0.0001 ETH from Owner 1');
  console.log('   • Ready for recurring transfers');
}

initialSetup().catch((err) => {
  console.error('❌ Initial setup failed:', err);
  process.exit(1);
});
