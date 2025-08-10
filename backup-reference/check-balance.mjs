import { CdpClient } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';

async function checkBalances() {
  const cdp = new CdpClient(CDP_CONFIG);

  console.log('🔍 Checking balances on Base Sepolia...\n');

  for (const [ownerName, ownerData] of Object.entries(OWNERS)) {
    console.log(`📊 ${ownerName.toUpperCase()} (${ownerData.address}):`);
    
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
      
      console.log(`  EOA Balance: ${ethBalance ? ethBalance.amount.amount : '0'} ETH`);
      
      // Get Smart Account for this owner
      const ownerAccount = privateKeyToAccount('0x' + ownerData.privateKey);
      const smartAccount = await cdp.evm.getOrCreateSmartAccount({
        name: SMART_ACCOUNTS[ownerName].name,
        owner: ownerAccount,
      });
      
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
      
      console.log(`  Smart Account Balance: ${smartEthBalance ? smartEthBalance.amount.amount : '0'} ETH`);
      
    } catch (error) {
      console.log(`  ❌ Error checking ${ownerName}: ${error.message}`);
    }
    
    console.log('');
  }

  // Also check for any existing CDP wallets/accounts
  console.log('🏦 Checking CDP Server Wallets...');
  try {
    const accounts = await cdp.evm.listAccounts();
    if (accounts.length > 0) {
      for (const account of accounts) {
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
          console.log(`  Balance: ${ethBalance ? ethBalance.amount.amount : '0'} ETH`);
        } catch (err) {
          console.log(`  Balance check failed: ${err.message}`);
        }
      }
    } else {
      console.log('  No CDP Server Wallets found');
    }
  } catch (error) {
    console.log(`  ❌ Error listing accounts: ${error.message}`);
  }
}

checkBalances().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});