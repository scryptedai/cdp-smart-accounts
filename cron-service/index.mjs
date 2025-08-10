import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SmartCronService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.setupComplete = false;
    this.accountsFile = 'db/cron-accounts.json';
  }

  async runScript(scriptPath) {
    return new Promise((resolve, reject) => {
      const fullPath = path.join(__dirname, scriptPath);
      const child = spawn('node', [fullPath], {
        stdio: 'pipe'
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text); // Real-time output
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        error += text;
        process.stderr.write(text); // Real-time error output
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Script ${scriptPath} failed with code ${code}: ${error}`));
        }
      });
    });
  }

  checkAccountsFile() {
    try {
      if (fs.existsSync(this.accountsFile)) {
        const accountsData = JSON.parse(fs.readFileSync(this.accountsFile, 'utf8'));
        console.log('✅ Found existing accounts file:', this.accountsFile);
        console.log('📊 Accounts loaded:');
        console.log(`   • ${Object.keys(accountsData.owners || {}).length} owners`);
        console.log(`   • ${Object.keys(accountsData.smartAccounts || {}).length} smart accounts`);
        console.log(`   • Created: ${accountsData.timestamp}`);
        return accountsData;
      } else {
        console.log('📂 No existing accounts file found');
        return null;
      }
    } catch (error) {
      console.log('⚠️ Error reading accounts file:', error.message);
      return null;
    }
  }

  async createNewAccounts() {
    console.log('\n🆕 Creating new 4 owners and 4 smart accounts...');
    try {
              await this.runScript('utils/create-four-smart-accounts.mjs');
      
      // Copy the generated file to our cron accounts file
      if (fs.existsSync('db/four-accounts-info.json')) {
        const accountsData = JSON.parse(fs.readFileSync('db/four-accounts-info.json', 'utf8'));
        fs.writeFileSync(this.accountsFile, JSON.stringify(accountsData, null, 2));
        console.log(`✅ Accounts data saved to ${this.accountsFile}`);
        return accountsData;
      } else {
        throw new Error('Failed to create accounts - no data file generated');
      }
    } catch (error) {
      console.error('❌ Failed to create new accounts:', error.message);
      throw error;
    }
  }

  async setupAccounts() {
    console.log('\n🔧 ACCOUNT SETUP PHASE');
    console.log('=' .repeat(50));
    
    // Check if accounts file exists
    let accountsData = this.checkAccountsFile();
    
    if (!accountsData) {
      // Create new accounts
      accountsData = await this.createNewAccounts();
    }
    
    // Verify we have valid account data
    if (!accountsData || !accountsData.owners || !accountsData.smartAccounts) {
      throw new Error('Invalid accounts data structure');
    }
    
    const ownerCount = Object.keys(accountsData.owners).length;
    const smartAccountCount = Object.keys(accountsData.smartAccounts).length;
    
    if (ownerCount !== 4 || smartAccountCount !== 4) {
      console.log('⚠️ Account count mismatch - creating fresh accounts');
      accountsData = await this.createNewAccounts();
    }
    
    console.log('\n📊 Using accounts:');
    Object.entries(accountsData.smartAccounts).forEach(([key, account]) => {
      console.log(`   ${key}: ${account.address}`);
    });
    
    return accountsData;
  }

  async initialFunding() {
    console.log('\n💰 INITIAL FUNDING PHASE');
    console.log('=' .repeat(50));
    
    try {
      console.log('💧 Requesting faucet funds for all accounts...');
              await this.runScript('utils/request-faucet-all-four.mjs');
      
      console.log('\n⏳ Waiting 20 seconds for faucet transactions to confirm...');
      await new Promise(resolve => setTimeout(resolve, 20000));
      
      console.log('\n📊 Checking initial balances...');
      await this.runScript('utils/print-balances.mjs');
      
    } catch (error) {
      console.log('⚠️ Initial funding had issues:', error.message);
      console.log('💡 Continuing with existing balances...');
    }
  }

  async recurringTask() {
    if (!this.setupComplete) {
      console.log('⚠️ Setup not complete, skipping recurring task');
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(`\n⏰ ${timestamp} - Running recurring transfer task`);
    console.log('-'.repeat(50));
    
    try {
      console.log('📊 BEFORE Transfer - Current balances:');
      await this.runScript('utils/balance-comparison.mjs');
      
      console.log('💸 Executing transfers: Owner 2 → Owner 3 & 4 (0.00001 ETH each)');
      await this.runScript('utils/smart-recurring-transfers.mjs');
      
      console.log('📊 AFTER Transfer - Updated balances with changes:');
      await this.runScript('utils/balance-comparison.mjs');
      
      console.log('✅ Recurring task completed successfully');
      
    } catch (error) {
      console.error('❌ Recurring task failed:', error.message);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Cron service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🎯 SMART WALLET CRON SERVICE');
    console.log('=' .repeat(60));
    console.log('📅 Schedule: Transfer 0.00001 ETH every 1 minute');
    console.log('🔄 Flow: Owner 2 → Owner 3 & 4');
    console.log('📊 Balance monitoring: All 4 accounts');
    console.log('🧠 Smart setup: Use existing or create new accounts');
    console.log('=' .repeat(60));

    try {
      // Phase 1: Setup accounts (existing or new)
      await this.setupAccounts();
      
      // Phase 2: Initial funding
      await this.initialFunding();
      
      this.setupComplete = true;
      console.log('\n✅ Setup completed successfully!');
      console.log('🔄 Starting recurring transfers every 1 minute...\n');
      
      // Start recurring task every 1 minute (60000 ms)
      this.intervalId = setInterval(() => {
        this.recurringTask().catch(error => {
          console.error('❌ Error in recurring task:', error.message);
        });
      }, 60000); // 1 minute = 60000 ms
      
      console.log('🟢 Cron service is now running...');
      console.log('Press Ctrl+C to stop\n');
      
    } catch (error) {
      console.error('❌ Failed to start cron service:', error.message);
      this.stop();
      process.exit(1);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('\n🔴 Cron service stopped');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  cronService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  cronService.stop();
  process.exit(0);
});

// Start the smart cron service
const cronService = new SmartCronService();
cronService.start().catch(error => {
  console.error('❌ Fatal error starting cron service:', error.message);
  process.exit(1);
});
