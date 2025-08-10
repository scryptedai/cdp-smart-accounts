import { CdpClient, parseUnits } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';
import { validateSpendAmount, formatEthAmount } from './spending-limit-validator.mjs';

async function transferWithPaymaster() {
  console.log('💸 Smart Account 2 transferring 0.00005 ETH with Paymaster gas sponsorship\n');

  const cdp = new CdpClient(CDP_CONFIG);

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

  console.log('📍 Smart Account 1 (Source):', smartAccount1.address);
  console.log('📍 Smart Account 2 (Recipient):', smartAccount2.address);

  // Check current balances
  console.log('\n💰 Current balances:');
  
  const account1Balance = await cdp.evm.listTokenBalances({
    address: smartAccount1.address,
    network: NETWORKS.testnet
  });
  
  const account2Balance = await cdp.evm.listTokenBalances({
    address: smartAccount2.address,
    network: NETWORKS.testnet
  });
  
  const account1Eth = account1Balance.balances.find(b => b.token.symbol === 'ETH');
  const account2Eth = account2Balance.balances.find(b => b.token.symbol === 'ETH');
  
  console.log(`   Smart Account 1: ${account1Eth ? account1Eth.amount.amount : '0'} wei`);
  console.log(`   Smart Account 2: ${account2Eth ? account2Eth.amount.amount : '0'} wei`);

  // Transfer another 0.00005 ETH (using remaining balance)
  const transferAmount = parseUnits("0.00005", 18); // 50000000000000 wei
  
  console.log('\n🎯 New Transfer with Paymaster:');
  console.log(`   Amount: 0.00005 ETH (${transferAmount} wei)`);
  console.log(`   From: Smart Account 1`);
  console.log(`   To: Smart Account 2`);
  console.log(`   Gas: Sponsored by Paymaster (no gas fees deducted)`);
  console.log(`   Paymaster: Coinbase Base paymaster`);

  try {
    // Validate spending limit
    console.log('\n🔍 Validating spending limit...');
    validateSpendAmount(smartAccount2.address, transferAmount);
    console.log('✅ Validation passed');

    console.log('\n🚀 Executing transfer with paymaster...');
    
    // Coinbase paymaster URL (provided by user)
    const paymasterUrl = "https://api.developer.coinbase.com/rpc/v1/base/gHCgcCWsIk5uoHKqyk7XRhjdWeXaCAoh";
    
    const userOperation = await smartAccount1.sendUserOperation({
      calls: [
        {
          to: smartAccount2.address,
          value: transferAmount,
          data: '0x',
        },
      ],
      network: NETWORKS.testnet,
      paymasterUrl: paymasterUrl // Gas sponsorship
    });

    console.log('✅ Transaction initiated with paymaster!');
    console.log('📋 User Operation Hash:', userOperation.userOpHash);
    console.log('⏳ Waiting for confirmation...');

    const receipt = await smartAccount1.waitForUserOperation({
      userOpHash: userOperation.userOpHash
    });

    if (receipt.status === 'complete') {
      console.log('🎉 Transaction completed with paymaster gas sponsorship!');
      console.log('📋 Transaction Hash:', receipt.transactionHash);
      console.log('🔗 Explorer:', `https://sepolia.basescan.org/tx/${receipt.transactionHash}`);

      // Check final balances
      console.log('\n💰 Final balances after paymaster transfer:');
      
      const finalAccount1Balance = await cdp.evm.listTokenBalances({
        address: smartAccount1.address,
        network: NETWORKS.testnet
      });
      
      const finalAccount2Balance = await cdp.evm.listTokenBalances({
        address: smartAccount2.address,
        network: NETWORKS.testnet
      });
      
      const finalAccount1Eth = finalAccount1Balance.balances.find(b => b.token.symbol === 'ETH');
      const finalAccount2Eth = finalAccount2Balance.balances.find(b => b.token.symbol === 'ETH');
      
      console.log(`   Smart Account 1: ${finalAccount1Eth ? finalAccount1Eth.amount.amount : '0'} wei`);
      console.log(`   Smart Account 2: ${finalAccount2Eth ? finalAccount2Eth.amount.amount : '0'} wei`);
      
      // Calculate the changes
      const account1Change = BigInt(account1Eth?.amount.amount || '0') - BigInt(finalAccount1Eth?.amount.amount || '0');
      const account2Change = BigInt(finalAccount2Eth?.amount.amount || '0') - BigInt(account2Eth?.amount.amount || '0');
      
      console.log('\n📊 Balance Changes:');
      console.log(`   Smart Account 1: -${account1Change} wei (${Number(account1Change) / 1e18} ETH)`);
      console.log(`   Smart Account 2: +${account2Change} wei (${Number(account2Change) / 1e18} ETH)`);
      
      if (account1Change === transferAmount && account2Change === transferAmount) {
        console.log('🎉 Perfect! No gas fees deducted - paymaster covered all costs');
      } else {
        console.log('⚠️ Some gas fees may have been deducted despite paymaster');
      }

    } else {
      console.error('❌ Transaction failed:', receipt.status);
    }

  } catch (error) {
    if (error.message.includes('paymaster')) {
      console.log('❌ Paymaster failed - trying without paymaster...');
      console.log('Error:', error.message);
      
      // Fallback to regular transaction
      console.log('\n🔄 Falling back to regular transaction...');
      await executeRegularTransfer(smartAccount1, smartAccount2, transferAmount);
      
    } else if (error.message.includes('spending limit')) {
      console.log('❌ Transaction blocked by spending limit');
      console.log('Error:', error.message);
    } else {
      console.error('❌ Transaction failed:', error.message);
    }
  }
}

async function executeRegularTransfer(smartAccount1, smartAccount2, transferAmount) {
  try {
    const userOperation = await smartAccount1.sendUserOperation({
      calls: [
        {
          to: smartAccount2.address,
          value: transferAmount,
          data: '0x',
        },
      ],
      network: NETWORKS.testnet,
      // No paymaster - regular gas payment
    });

    console.log('✅ Regular transaction initiated');
    console.log('📋 User Operation Hash:', userOperation.userOpHash);

    const receipt = await smartAccount1.waitForUserOperation({
      userOpHash: userOperation.userOpHash
    });

    if (receipt.status === 'complete') {
      console.log('✅ Regular transaction completed');
      console.log('📋 Transaction Hash:', receipt.transactionHash);
      console.log('⚠️ Gas fees were deducted from Smart Account 1');
    }

  } catch (fallbackError) {
    console.error('❌ Fallback transaction also failed:', fallbackError.message);
  }
}

transferWithPaymaster().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
