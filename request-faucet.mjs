import 'dotenv/config';
import { CdpClient } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';

async function requestFaucetFunds() {
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

  console.log('🚰 Requesting faucet funds on Base Sepolia...\n');

  try {
    // Get the Smart Account
    const ownerAccount = privateKeyToAccount('0x' + owner1.privateKey);
    const smartAccount = await cdp.evm.getOrCreateSmartAccount({
      name: 'smart-wallet-owner1',
      owner: ownerAccount,
    });

    console.log(`📍 Smart Account: ${smartAccount.address}`);

    // Request faucet for the Smart Account
    console.log('💰 Requesting ETH from faucet...');
    const faucetResult = await cdp.evm.requestFaucet({
      address: smartAccount.address,
      network: 'base-sepolia',
      token: 'eth'
    });

    console.log('✅ Faucet request successful!');
    console.log(`📋 Transaction Hash: ${faucetResult.transactionHash}`);
    console.log(`🔗 Base Sepolia Explorer: https://sepolia.basescan.org/tx/${faucetResult.transactionHash}`);

    // Also try requesting for the EOA
    console.log('\n💰 Requesting ETH for EOA...');
    const eoaFaucetResult = await cdp.evm.requestFaucet({
      address: owner1.address,
      network: 'base-sepolia',
      token: 'eth'
    });

    console.log('✅ EOA faucet request successful!');
    console.log(`📋 Transaction Hash: ${eoaFaucetResult.transactionHash}`);
    console.log(`🔗 Base Sepolia Explorer: https://sepolia.basescan.org/tx/${eoaFaucetResult.transactionHash}`);

    console.log('\n⏳ Wait a few minutes for transactions to confirm, then check balances again!');

  } catch (error) {
    console.error('❌ Faucet request failed:', error.message);
    
    if (error.message.includes('rate limit') || error.message.includes('limit')) {
      console.log('\n💡 Tip: CDP faucet has rate limits. Try these alternatives:');
      console.log('   • Chainlink Faucet: https://faucets.chain.link/base-sepolia');
      console.log('   • Alchemy Faucet: https://sepoliafaucet.com/');
      console.log(`   • Send to Smart Account: ${smartAccount?.address || 'N/A'}`);
      console.log(`   • Send to EOA: ${owner1.address}`);
    }
  }
}

requestFaucetFunds().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
