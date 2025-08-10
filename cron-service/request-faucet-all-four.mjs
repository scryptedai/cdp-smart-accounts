import { CdpClient } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, SMART_ACCOUNTS, NETWORKS } from './config.mjs';

async function requestFaucetForAllFour() {
  console.log('🚰 Requesting faucet funds for all 4 Smart Accounts on Base Sepolia...\n');

  const cdp = new CdpClient(CDP_CONFIG);
  const faucetResults = [];

  for (const [ownerName, ownerData] of Object.entries(OWNERS)) {
    console.log(`💰 Processing ${ownerName.toUpperCase()}...`);
    console.log(`   Owner Address: ${ownerData.address}`);

    const faucetResult = {
      account: ownerName,
      ownerAddress: ownerData.address,
      smartAccountAddress: null,
      ownerFaucetTx: null,
      smartAccountFaucetTx: null,
      ownerFaucetStatus: 'pending',
      smartAccountFaucetStatus: 'pending'
    };

    try {
      // Get the Smart Account
      const ownerAccount = privateKeyToAccount('0x' + ownerData.privateKey);
      const smartAccount = await cdp.evm.getOrCreateSmartAccount({
        name: SMART_ACCOUNTS[ownerName].name,
        owner: ownerAccount,
      });

      faucetResult.smartAccountAddress = smartAccount.address;
      console.log(`   Smart Account: ${smartAccount.address}`);

      // Request faucet for the Smart Account
      console.log('   💧 Requesting ETH for Smart Account...');
      try {
        const smartAccountFaucet = await cdp.evm.requestFaucet({
          address: smartAccount.address,
          network: NETWORKS.testnet,
          token: 'eth'
        });

        faucetResult.smartAccountFaucetTx = smartAccountFaucet.transactionHash;
        faucetResult.smartAccountFaucetStatus = 'success';
        console.log('   ✅ Smart Account faucet successful!');
        console.log(`   📋 Transaction Hash: ${smartAccountFaucet.transactionHash}`);
        console.log(`   🔗 Explorer: https://sepolia.basescan.org/tx/${smartAccountFaucet.transactionHash}`);

      } catch (smartFaucetError) {
        faucetResult.smartAccountFaucetStatus = 'failed';
        console.log('   ❌ Smart Account faucet failed:', smartFaucetError.message);
      }

      // Also try requesting for the EOA (owner address)
      console.log('   💧 Requesting ETH for Owner EOA...');
      try {
        const eoaFaucet = await cdp.evm.requestFaucet({
          address: ownerData.address,
          network: NETWORKS.testnet,
          token: 'eth'
        });

        faucetResult.ownerFaucetTx = eoaFaucet.transactionHash;
        faucetResult.ownerFaucetStatus = 'success';
        console.log('   ✅ Owner EOA faucet successful!');
        console.log(`   📋 Transaction Hash: ${eoaFaucet.transactionHash}`);
        console.log(`   🔗 Explorer: https://sepolia.basescan.org/tx/${eoaFaucet.transactionHash}`);

      } catch (eoaFaucetError) {
        faucetResult.ownerFaucetStatus = 'failed';
        console.log('   ❌ Owner EOA faucet failed:', eoaFaucetError.message);
      }

    } catch (error) {
      console.log(`   ❌ Error processing ${ownerName}:`, error.message);
      faucetResult.ownerFaucetStatus = 'error';
      faucetResult.smartAccountFaucetStatus = 'error';
    }

    faucetResults.push(faucetResult);
    console.log('');
  }

  // Display summary
  console.log('📋 FAUCET REQUEST SUMMARY:');
  console.log('═'.repeat(120));
  console.log('Account  │ Smart Account Faucet │ Owner EOA Faucet │ Smart Account Address');
  console.log('─'.repeat(120));
  
  faucetResults.forEach(result => {
    const smartStatus = getStatusIcon(result.smartAccountFaucetStatus);
    const ownerStatus = getStatusIcon(result.ownerFaucetStatus);
    const smartAddr = result.smartAccountAddress || 'N/A';
    
    console.log(`${result.account.padEnd(8)} │ ${smartStatus.padEnd(19)} │ ${ownerStatus.padEnd(15)} │ ${smartAddr}`);
  });
  
  console.log('═'.repeat(120));

  // Count successes
  const smartAccountSuccesses = faucetResults.filter(r => r.smartAccountFaucetStatus === 'success').length;
  const ownerSuccesses = faucetResults.filter(r => r.ownerFaucetStatus === 'success').length;
  
  console.log(`\n🎉 RESULTS:`);
  console.log(`   Smart Account Faucets: ${smartAccountSuccesses}/4 successful`);
  console.log(`   Owner EOA Faucets: ${ownerSuccesses}/4 successful`);
  console.log(`   Total Successful Requests: ${smartAccountSuccesses + ownerSuccesses}/8`);

  // Show failed requests with alternative funding options
  const failedRequests = faucetResults.filter(r => 
    r.smartAccountFaucetStatus === 'failed' || r.ownerFaucetStatus === 'failed'
  );

  if (failedRequests.length > 0) {
    console.log(`\n⚠️ Some faucet requests failed. Alternative funding options:`);
    console.log('   • Chainlink Faucet: https://faucets.chain.link/base-sepolia');
    console.log('   • Alchemy Faucet: https://sepoliafaucet.com/');
    console.log('   • Manual funding for the following addresses:');
    
    failedRequests.forEach(result => {
      if (result.smartAccountFaucetStatus === 'failed') {
        console.log(`     • ${result.account} Smart Account: ${result.smartAccountAddress}`);
      }
      if (result.ownerFaucetStatus === 'failed') {
        console.log(`     • ${result.account} Owner EOA: ${result.ownerAddress}`);
      }
    });
  }

  console.log('\n⏳ Wait a few minutes for transactions to confirm, then check balances:');
  console.log('   node check-four-accounts-balance.mjs');
}

function getStatusIcon(status) {
  switch (status) {
    case 'success': return '✅ Success';
    case 'failed': return '❌ Failed';
    case 'error': return '💥 Error';
    default: return '⏳ Pending';
  }
}

requestFaucetForAllFour().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
