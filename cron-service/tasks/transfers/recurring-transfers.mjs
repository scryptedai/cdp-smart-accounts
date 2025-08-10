import { CdpClient, parseUnits } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from '../../config.mjs';

async function recurringTransfers() {
  console.log('💸 Recurring Transfer: Owner 2 → Owner 3 & 4 (0.00001 ETH each)\n');

  const cdp = new CdpClient(CDP_CONFIG);

  // Get accounts
  const owner2Account = privateKeyToAccount('0x' + OWNERS.owner2.privateKey);

  const smartAccount2 = await cdp.evm.getOrCreateSmartAccount({
    name: `cron-${SMART_ACCOUNTS.owner2.name}-transfer`,
    owner: owner2Account,
  });

  // Use known addresses instead of creating new smart accounts
  const smartAccount3Address = SMART_ACCOUNTS.owner3.address;
  const smartAccount4Address = SMART_ACCOUNTS.owner4.address;

  console.log('📍 From: Smart Account 2 (Owner 2):', smartAccount2.address);
  console.log('📍 To: Smart Account 3 (Owner 3):', smartAccount3Address);
  console.log('📍 To: Smart Account 4 (Owner 4):', smartAccount4Address);

  const transferAmount = parseUnits("0.00001", 18); // 0.00001 ETH per recipient
  console.log(`💰 Amount per transfer: 0.00001 ETH (${transferAmount} wei)`);
  console.log(`💰 Total amount: 0.00002 ETH (${transferAmount * 2n} wei)\n`);

  // Check Owner 2 balance first
  try {
    const balanceResult = await cdp.evm.listTokenBalances({
      address: smartAccount2.address,
      network: NETWORKS.testnet
    });
    
    const ethBalance = balanceResult.balances.find(b => 
      b.token.contractAddress === '0x0000000000000000000000000000000000000000' ||
      b.token.symbol === 'ETH'
    );
    
    const currentBalance = BigInt(ethBalance ? ethBalance.amount.amount : '0');
    const requiredAmount = transferAmount * 2n; // Total needed for both transfers
    
    console.log(`🔍 Owner 2 current balance: ${formatEthAmount(currentBalance.toString())} ETH`);
    console.log(`🎯 Required for transfers: ${formatEthAmount(requiredAmount.toString())} ETH`);
    
    if (currentBalance < requiredAmount) {
      console.log('⚠️ Insufficient balance for transfers!');
      console.log('💡 Skipping transfers to prevent failure');
      return;
    }
    
  } catch (balanceError) {
    console.log('❌ Could not check balance:', balanceError.message);
    console.log('🤞 Attempting transfers anyway...');
  }

  try {
    // Execute batch transfer to both Owner 3 and Owner 4
    console.log('🚀 Executing batch transfer...');
    const userOperation = await smartAccount2.sendUserOperation({
      calls: [
        {
          to: smartAccount3Address,
          value: transferAmount,
          data: '0x',
        },
        {
          to: smartAccount4Address,
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
      console.log('🎉 Batch transfer completed successfully!');
      console.log('📋 Transaction Hash:', receipt.transactionHash);
      console.log('🔗 Explorer:', `https://sepolia.basescan.org/tx/${receipt.transactionHash}`);
      console.log('✅ Owner 3 received: 0.00001 ETH');
      console.log('✅ Owner 4 received: 0.00001 ETH');
    } else {
      console.log('❌ Batch transfer failed:', receipt.status);
    }

  } catch (error) {
    console.error('❌ Recurring transfer failed:', error.message);
    
    // If batch transfer fails, try individual transfers
    console.log('\n🔄 Attempting individual transfers as fallback...');
    
    try {
      // Transfer to Owner 3
      console.log('💸 Transferring to Owner 3...');
      const userOp3 = await smartAccount2.sendUserOperation({
        calls: [{
          to: smartAccount3Address,
          value: transferAmount,
          data: '0x',
        }],
        network: NETWORKS.testnet,
      });
      
      const receipt3 = await smartAccount2.waitForUserOperation({
        userOpHash: userOp3.userOpHash
      });
      
      if (receipt3.status === 'complete') {
        console.log('✅ Transfer to Owner 3 successful');
      }
      
      // Transfer to Owner 4
      console.log('💸 Transferring to Owner 4...');
      const userOp4 = await smartAccount2.sendUserOperation({
        calls: [{
          to: smartAccount4Address,
          value: transferAmount,
          data: '0x',
        }],
        network: NETWORKS.testnet,
      });
      
      const receipt4 = await smartAccount2.waitForUserOperation({
        userOpHash: userOp4.userOpHash
      });
      
      if (receipt4.status === 'complete') {
        console.log('✅ Transfer to Owner 4 successful');
      }
      
    } catch (fallbackError) {
      console.error('❌ Fallback transfers also failed:', fallbackError.message);
    }
  }

  console.log('\n📊 Recurring transfer task completed');
}

function formatEthAmount(amountWei) {
  const amount = BigInt(amountWei);
  return (Number(amount) / 1e18).toFixed(6);
}

recurringTransfers().catch((err) => {
  console.error('❌ Recurring transfers failed:', err);
  process.exit(1);
});
