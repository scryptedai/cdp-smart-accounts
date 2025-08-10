import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CronService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.setupComplete = false;
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

  async initialSetup() {
    console.log('\n🚀 CRON SERVICE STARTING - Initial Setup');
    console.log('=' .repeat(60));
    
    try {
      console.log('\n📋 Step 1: Running initial faucet and transfer setup...');
      await this.runScript('tasks/setup/initial-setup.mjs');
      
      console.log('\n📊 Step 2: Checking initial balances...');
      await this.runScript('tasks/balances/print-balances.mjs');
      
      this.setupComplete = true;
      console.log('\n✅ Initial setup completed successfully!');
      console.log('🔄 Starting recurring transfers every 1 minute...\n');
      
    } catch (error) {
      console.error('❌ Initial setup failed:', error.message);
      throw error;
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
      console.log('💸 Executing transfers: Owner 2 → Owner 3 & 4 (0.00001 ETH each)');
      await this.runScript('tasks/transfers/recurring-transfers.mjs');
      
      console.log('\n📊 Updated balances:');
      await this.runScript('tasks/balances/print-balances.mjs');
      
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
    console.log('=' .repeat(60));

    try {
      // Run initial setup
      await this.initialSetup();
      
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

// Start the cron service
const cronService = new CronService();
cronService.start().catch(error => {
  console.error('❌ Fatal error starting cron service:', error.message);
  process.exit(1);
});
