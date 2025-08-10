import { CdpClient } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';

async function printBalances() {
  const cdp = new CdpClient(CDP_CONFIG);
  const timestamp = new Date().toISOString();
  
  console.log(`📊 BALANCE REPORT - ${timestamp}`);
  console.log('═'.repeat(80));

  const balances = [];

  for (const [ownerName, ownerData] of Object.entries(OWNERS)) {
    try {
      // Use the known smart account address directly instead of creating new ones
      const smartAccountAddress = SMART_ACCOUNTS[ownerName].address;

      // Check Smart Account balance using the known address
      const balanceResult = await cdp.evm.listTokenBalances({
        address: smartAccountAddress,
        network: NETWORKS.testnet
      });
      
      const ethBalance = balanceResult.balances.find(b => 
        b.token.contractAddress === '0x0000000000000000000000000000000000000000' ||
        b.token.symbol === 'ETH'
      );
      
      const balance = ethBalance ? ethBalance.amount.amount : '0';
      const ethAmount = formatEthAmount(balance);
      
      balances.push({
        name: ownerName,
        address: smartAccountAddress,
        balance: ethAmount,
        wei: balance
      });
      
      console.log(`💰 ${ownerName.toUpperCase().padEnd(7)} ${ethAmount.padStart(12)} ETH │ ${smartAccountAddress}`);
      
    } catch (error) {
      console.log(`❌ ${ownerName.toUpperCase().padEnd(7)} ERROR: ${error.message}`);
      balances.push({
        name: ownerName,
        address: 'ERROR',
        balance: '0.000000',
        wei: '0'
      });
    }
  }

  console.log('─'.repeat(80));
  
  // Calculate total
  const totalWei = balances.reduce((sum, account) => sum + BigInt(account.wei), 0n);
  const totalEth = formatEthAmount(totalWei.toString());
  
  console.log(`🏦 TOTAL:   ${totalEth.padStart(12)} ETH │ Across all 4 Smart Accounts`);
  console.log('═'.repeat(80));
  
  // Show changes since last run (if we had previous data)
  const currentTime = new Date().toLocaleTimeString();
  console.log(`⏰ Last updated: ${currentTime}`);
  
  // Quick summary for cron log
  console.log('\n📋 QUICK SUMMARY:');
  balances.forEach(account => {
    console.log(`   ${account.name}: ${account.balance} ETH`);
  });
  console.log(`   Total: ${totalEth} ETH\n`);
}

function formatEthAmount(amountWei) {
  const amount = BigInt(amountWei);
  return (Number(amount) / 1e18).toFixed(6);
}

printBalances().catch((err) => {
  console.error('❌ Balance printing failed:', err);
  process.exit(1);
});
