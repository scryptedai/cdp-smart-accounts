import { CdpClient } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';
import fs from 'fs';

async function balanceComparison() {
  const cdp = new CdpClient(CDP_CONFIG);
  const timestamp = new Date().toISOString();
  
  console.log(`📊 BALANCE COMPARISON - ${timestamp}`);
  console.log('═'.repeat(80));

  const currentBalances = [];

  // Get current balances
  for (const [ownerName, ownerData] of Object.entries(OWNERS)) {
    try {
      // Use the known smart account address directly
      const smartAccountAddress = SMART_ACCOUNTS[ownerName].address;

      // Check Smart Account balance
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
      
      currentBalances.push({
        name: ownerName,
        address: smartAccountAddress,
        balance: ethAmount,
        wei: balance.toString() // Convert BigInt to string for JSON serialization
      });
      
    } catch (error) {
      console.log(`❌ ${ownerName.toUpperCase().padEnd(7)} ERROR: ${error.message}`);
      currentBalances.push({
        name: ownerName,
        address: 'ERROR',
        balance: '0.000000',
        wei: '0'
      });
    }
  }

  // Load previous balances if they exist
  let previousBalances = [];
  try {
    if (fs.existsSync('db/last-balances.json')) {
      previousBalances = JSON.parse(fs.readFileSync('db/last-balances.json', 'utf8'));
    }
  } catch (error) {
    // No previous balances, first run
  }

  // Display current balances with changes
  for (const account of currentBalances) {
    const previous = previousBalances.find(p => p.name === account.name);
    const currentEth = parseFloat(account.balance);
    const previousEth = previous ? parseFloat(previous.balance) : 0;
    const change = currentEth - previousEth;
    
    let changeStr = '';
    if (previous && change !== 0) {
      const changeSign = change > 0 ? '+' : '';
      changeStr = ` (${changeSign}${change.toFixed(6)} ETH)`;
      
      if (change > 0) {
        changeStr = `\x1b[32m${changeStr}\x1b[0m`; // Green for positive
      } else {
        changeStr = `\x1b[31m${changeStr}\x1b[0m`; // Red for negative  
      }
    }
    
    console.log(`💰 ${account.name.toUpperCase().padEnd(7)} ${account.balance.padStart(12)} ETH${changeStr} │ ${account.address}`);
  }

  console.log('─'.repeat(80));
  
  // Calculate totals
  const currentTotal = currentBalances.reduce((sum, account) => sum + parseFloat(account.balance), 0);
  const previousTotal = previousBalances.reduce((sum, account) => sum + parseFloat(account.balance), 0);
  const totalChange = currentTotal - previousTotal;
  
  let totalChangeStr = '';
  if (previousBalances.length > 0 && totalChange !== 0) {
    const changeSign = totalChange > 0 ? '+' : '';
    totalChangeStr = ` (${changeSign}${totalChange.toFixed(6)} ETH)`;
    
    if (totalChange > 0) {
      totalChangeStr = `\x1b[32m${totalChangeStr}\x1b[0m`; // Green
    } else {
      totalChangeStr = `\x1b[31m${totalChangeStr}\x1b[0m`; // Red
    }
  }
  
  console.log(`🏦 TOTAL:   ${currentTotal.toFixed(6).padStart(12)} ETH${totalChangeStr} │ Across all 4 Smart Accounts`);
  console.log('═'.repeat(80));
  
  // Show transfer summary if there were changes
  if (previousBalances.length > 0) {
    const transfers = [];
    for (const account of currentBalances) {
      const previous = previousBalances.find(p => p.name === account.name);
      if (previous) {
        const change = parseFloat(account.balance) - parseFloat(previous.balance);
        if (Math.abs(change) > 0.000001) { // Only show significant changes
          transfers.push({
            account: account.name,
            change: change
          });
        }
      }
    }
    
    if (transfers.length > 0) {
      console.log('\n🔄 TRANSFER SUMMARY:');
      transfers.forEach(transfer => {
        const sign = transfer.change > 0 ? '+' : '';
        const color = transfer.change > 0 ? '\x1b[32m' : '\x1b[31m';
        console.log(`   ${transfer.account}: ${color}${sign}${transfer.change.toFixed(6)} ETH\x1b[0m`);
      });
    }
  }
  
  // Save current balances for next comparison
  fs.writeFileSync('db/last-balances.json', JSON.stringify(currentBalances, null, 2));
  
  const currentTime = new Date().toLocaleTimeString();
  console.log(`\n⏰ Last updated: ${currentTime}\n`);
}

function formatEthAmount(amountWei) {
  const amount = BigInt(amountWei);
  return (Number(amount) / 1e18).toFixed(6);
}

balanceComparison().catch((err) => {
  console.error('❌ Balance comparison failed:', err);
  process.exit(1);
});
