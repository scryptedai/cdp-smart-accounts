import { CdpClient } from '@coinbase/cdp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { CDP_CONFIG, OWNERS, NETWORKS } from './config.mjs';

async function main() {
  console.log('🚀 CDP Smart Wallet Setup\n');

  const cdp = new CdpClient(CDP_CONFIG);

  // Use owner1 (only one that can have a Smart Account due to CDP limitation)
  const owner1 = OWNERS.owner1;
  const ownerAccount = privateKeyToAccount('0x' + owner1.privateKey);

  console.log('📍 Owner EOA:', owner1.address);

  // Create or get Smart Account
  const smartAccount = await cdp.evm.getOrCreateSmartAccount({
    name: 'smart-wallet-owner1',
    owner: ownerAccount,
  });

  console.log('📍 Smart Account:', smartAccount.address);

  // Request faucet funds
  console.log('\n💰 Requesting testnet funds...');
  try {
    const faucet = await cdp.evm.requestFaucet({
      address: smartAccount.address,
      network: NETWORKS.testnet,
      token: 'eth',
    });
    console.log('✅ Faucet TX:', faucet.transactionHash);
    console.log('🔗 Explorer:', `https://sepolia.basescan.org/tx/${faucet.transactionHash}`);
  } catch (err) {
    console.warn('⚠️ Faucet failed:', err?.message || err);
  }

  console.log('\n🎯 Setup complete!');
  console.log('   • Smart Account ready for operations');
  console.log('   • Use other scripts for balance checks, transfers, etc.');
  console.log('   • For mainnet swaps: Fund the Smart Account on Base mainnet');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
