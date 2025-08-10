import { CdpClient } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';

async function checkFourAccountsBalances() {
  const cdp = new CdpClient(CDP_CONFIG);

  console.log('🔍 Checking balances for all 4 accounts on Base Sepolia...\n');

  const accountSummary = [];

  for (const [ownerName, ownerData] of Object.entries(OWNERS)) {
    console.log(`📊 ${ownerName.toUpperCase()} (${ownerData.address}):`);
    
    const accountInfo = {
      name: ownerName,
      ownerAddress: ownerData.address,
      smartAccountAddress: null,
      ownerBalance: '0',
      smartAccountBalance: '0',
      status: 'checking'
    };

    try {
      // Check EOA balance
      const balanceResult = await cdp.evm.listTokenBalances({
        address: ownerData.address,
        network: NETWORKS.testnet
      });
      
      const ethBalance = balanceResult.balances.find(b => 
        b.token.contractAddress === '0x0000000000000000000000000000000000000000' ||
        b.token.symbol === 'ETH'
      );
      
      accountInfo.ownerBalance = ethBalance ? ethBalance.amount.amount : '0';
      console.log(`  EOA Balance: ${formatEthAmount(accountInfo.ownerBalance)} ETH`);
      
      // Get Smart Account for this owner
      const ownerAccount = privateKeyToAccount('0x' + ownerData.privateKey);
      const smartAccount = await cdp.evm.getOrCreateSmartAccount({
        name: SMART_ACCOUNTS[ownerName].name,
        owner: ownerAccount,
      });
      
      accountInfo.smartAccountAddress = smartAccount.address;
      console.log(`  Smart Account: ${smartAccount.address}`);
      
      // Check Smart Account balance
      const smartBalanceResult = await cdp.evm.listTokenBalances({
        address: smartAccount.address,
        network: NETWORKS.testnet
      });
      
      const smartEthBalance = smartBalanceResult.balances.find(b => 
        b.token.contractAddress === '0x0000000000000000000000000000000000000000' ||
        b.token.symbol === 'ETH'
      );
      
      accountInfo.smartAccountBalance = smartEthBalance ? smartEthBalance.amount.amount : '0';
      console.log(`  Smart Account Balance: ${formatEthAmount(accountInfo.smartAccountBalance)} ETH`);
      accountInfo.status = 'success';
      
    } catch (error) {
      console.log(`  ❌ Error checking ${ownerName}: ${error.message}`);
      accountInfo.status = 'error';
    }
    
    accountSummary.push(accountInfo);
    console.log('');
  }

  // Display summary table
  console.log('📋 SUMMARY TABLE:');
  console.log('═'.repeat(100));
  console.log('Account  │ Owner Balance │ Smart Account Balance │ Smart Account Address');
  console.log('─'.repeat(100));
  
  accountSummary.forEach(account => {
    const ownerBal = formatEthAmount(account.ownerBalance).padEnd(12);
    const smartBal = formatEthAmount(account.smartAccountBalance).padEnd(20);
    const smartAddr = account.smartAccountAddress || 'N/A';
    console.log(`${account.name.padEnd(8)} │ ${ownerBal} ETH │ ${smartBal} ETH │ ${smartAddr}`);
  });
  
  console.log('═'.repeat(100));

  // Calculate totals
  const totalOwnerBalance = accountSummary.reduce((sum, acc) => 
    sum + parseFloat(formatEthAmount(acc.ownerBalance)), 0);
  const totalSmartBalance = accountSummary.reduce((sum, acc) => 
    sum + parseFloat(formatEthAmount(acc.smartAccountBalance)), 0);
  
  console.log(`\n💰 TOTALS:`);
  console.log(`   Total EOA Balance: ${totalOwnerBalance.toFixed(6)} ETH`);
  console.log(`   Total Smart Account Balance: ${totalSmartBalance.toFixed(6)} ETH`);
  console.log(`   Grand Total: ${(totalOwnerBalance + totalSmartBalance).toFixed(6)} ETH`);

  // Check for any failed accounts
  const failedAccounts = accountSummary.filter(acc => acc.status === 'error');
  if (failedAccounts.length > 0) {
    console.log(`\n⚠️ Failed to check ${failedAccounts.length} account(s):`);
    failedAccounts.forEach(acc => console.log(`   • ${acc.name}`));
  }

  // Success count
  const successCount = accountSummary.filter(acc => acc.status === 'success').length;
  console.log(`\n✅ Successfully checked ${successCount}/4 accounts`);

  // Also check for any existing CDP wallets/accounts
  console.log('\n🏦 Checking CDP Server Wallets...');
  try {
    const accounts = await cdp.evm.listAccounts();
    if (accounts.length > 0) {
      console.log(`Found ${accounts.length} CDP server account(s):`);
      for (const account of accounts.slice(0, 10)) { // Limit to first 10
        console.log(`  Account: ${account.name} (${account.address})`);
        try {
          const balanceResult = await cdp.evm.listTokenBalances({
            address: account.address,
            network: NETWORKS.testnet
          });
          const ethBalance = balanceResult.balances.find(b => 
            b.token.contractAddress === '0x0000000000000000000000000000000000000000' ||
            b.token.symbol === 'ETH'
          );
          console.log(`  Balance: ${formatEthAmount(ethBalance ? ethBalance.amount.amount : '0')} ETH`);
        } catch (err) {
          console.log(`  Balance check failed: ${err.message}`);
        }
      }
      if (accounts.length > 10) {
        console.log(`  ... and ${accounts.length - 10} more accounts`);
      }
    } else {
      console.log('  No CDP Server Wallets found');
    }
  } catch (error) {
    console.log(`  ❌ Error listing accounts: ${error.message}`);
  }
}

function formatEthAmount(amountWei) {
  const amount = BigInt(amountWei);
  return (Number(amount) / 1e18).toFixed(6);
}

checkFourAccountsBalances().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
