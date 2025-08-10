import { CdpClient } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';

async function checkExactBalances() {
  console.log('🔍 Checking exact balances after the transfer...\n');

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

  console.log('📍 Smart Account 1:', smartAccount1.address);
  console.log('📍 Smart Account 2:', smartAccount2.address);

  // Get detailed balance information
  const account1Balance = await cdp.evm.listTokenBalances({
    address: smartAccount1.address,
    network: NETWORKS.testnet
  });
  
  const account2Balance = await cdp.evm.listTokenBalances({
    address: smartAccount2.address,
    network: NETWORKS.testnet
  });

  console.log('\n💰 Detailed Balance Information:');
  
  console.log('\n📊 Smart Account 1 Balances:');
  if (account1Balance.balances.length > 0) {
    for (const balance of account1Balance.balances) {
      const symbol = balance.token.symbol || 'Unknown';
      const decimals = balance.token.decimals || 18;
      const amount = balance.amount.amount;
      const formattedAmount = (BigInt(amount) / BigInt(10 ** decimals)).toString();
      const exactWei = amount;
      
      console.log(`   ${symbol}: ${formattedAmount} (${exactWei} wei)`);
    }
  } else {
    console.log('   No balances found');
  }

  console.log('\n📊 Smart Account 2 Balances:');
  if (account2Balance.balances.length > 0) {
    for (const balance of account2Balance.balances) {
      const symbol = balance.token.symbol || 'Unknown';
      const decimals = balance.token.decimals || 18;
      const amount = balance.amount.amount;
      const formattedAmount = (BigInt(amount) / BigInt(10 ** decimals)).toString();
      const exactWei = amount;
      
      console.log(`   ${symbol}: ${formattedAmount} (${exactWei} wei)`);
    }
  } else {
    console.log('   No balances found');
  }

  // Calculate expected balances
  console.log('\n🎯 Expected vs Actual:');
  console.log('Expected after 0.00005 ETH transfer:');
  console.log('   Smart Account 1: 0.00005 ETH (50000000000000 wei)');
  console.log('   Smart Account 2: 0.00015 ETH (150000000000000 wei)');
  
  // Check the specific ETH balances
  const account1Eth = account1Balance.balances.find(b => 
    b.token.contractAddress === '0x0000000000000000000000000000000000000000' ||
    b.token.symbol === 'ETH'
  );
  
  const account2Eth = account2Balance.balances.find(b => 
    b.token.contractAddress === '0x0000000000000000000000000000000000000000' ||
    b.token.symbol === 'ETH'
  );

  if (account1Eth && account2Eth) {
    const account1Wei = BigInt(account1Eth.amount.amount);
    const account2Wei = BigInt(account2Eth.amount.amount);
    
    console.log('\nActual ETH balances:');
    console.log(`   Smart Account 1: ${account1Wei} wei`);
    console.log(`   Smart Account 2: ${account2Wei} wei`);
    
    // Check if balances changed as expected
    const expectedAccount1 = BigInt('50000000000000'); // 0.00005 ETH
    const expectedAccount2 = BigInt('150000000000000'); // 0.00015 ETH
    
    console.log('\n🔍 Analysis:');
    if (account1Wei < BigInt('100000000000000')) {
      console.log('✅ Smart Account 1 balance decreased (transfer occurred)');
    } else {
      console.log('❌ Smart Account 1 balance unchanged (no transfer?)');
    }
    
    if (account2Wei > BigInt('100000000000000')) {
      console.log('✅ Smart Account 2 balance increased (transfer received)');
    } else {
      console.log('❌ Smart Account 2 balance unchanged (no transfer received?)');
    }
    
    // Calculate the difference from gas fees
    const totalBalance = account1Wei + account2Wei;
    const originalTotal = BigInt('200000000000000'); // 0.0002 ETH total
    const gasFees = originalTotal - totalBalance;
    
    console.log(`\n⛽ Gas Analysis:`);
    console.log(`   Original total: ${originalTotal} wei (0.0002 ETH)`);
    console.log(`   Current total: ${totalBalance} wei`);
    console.log(`   Gas fees paid: ${gasFees} wei (${Number(gasFees) / 1e18} ETH)`);
  }
}

checkExactBalances().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
