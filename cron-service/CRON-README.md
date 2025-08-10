# Smart Wallet Cron Service

## Overview
This cron service automates recurring transfers between 4 smart wallet accounts every 1 minute.

## Account Structure
- **Owner 1**: 0x382d233262Fc9737188B6F6b2a25a24e05319F5E
- **Owner 2**: 0x55f7415B24eA71537d8E4b9Cb09Dc8244D36f231  
- **Owner 3**: 0x7481bB1D70e983b1DC8889242b909500Fa2A8C38
- **Owner 4**: 0x3EA7294ff093215f733Be3A1C6c761168F1bF216

## Cron Logic

### Initial Setup (runs once):
1. **Owner 1** gets 0.0001 ETH from faucet
2. **Owner 2** gets 0.0001 ETH from Owner 1
3. Print initial balances

### Recurring Task (every 1 minute):
1. **Owner 2** transfers 0.00001 ETH to **Owner 3**
2. **Owner 2** transfers 0.00001 ETH to **Owner 4**  
3. Print updated balances of all addresses

## Folder Structure
```
cron-service/
├── cron-index.mjs              # Main cron service controller
├── tasks/
│   ├── setup/
│   │   └── initial-setup.mjs   # Initial faucet + transfer setup
│   ├── transfers/
│   │   └── recurring-transfers.mjs # Owner 2 → Owner 3 & 4
│   └── balances/
│       └── print-balances.mjs  # Balance reporter for all accounts
├── config.mjs                  # Account configuration
└── package.json               # Scripts and dependencies
```

## Usage

### Start the Cron Service
```bash
npm run cron
```
or
```bash
node cron-index.mjs
```

### Manual Testing
```bash
# Run initial setup only
npm run setup

# Run recurring transfer only  
npm run transfer-recurring

# Print balances only
npm run balance-all
```

## Expected Flow

### Initial State:
- Owner 1: ~0.000200 ETH
- Owner 2: ~0.000370 ETH  
- Owner 3: ~0.000200 ETH
- Owner 4: ~0.000200 ETH

### After Initial Setup:
- Owner 1: ~0.000100 ETH (received faucet, sent 0.0001 to Owner 2)
- Owner 2: ~0.000470 ETH (received 0.0001 from Owner 1)
- Owner 3: ~0.000200 ETH (unchanged)
- Owner 4: ~0.000200 ETH (unchanged)

### After Each Recurring Transfer (every minute):
- Owner 1: ~0.000100 ETH (unchanged)
- Owner 2: ~0.000450 ETH (sent 0.00002 total to Owner 3 & 4)
- Owner 3: ~0.000210 ETH (received 0.00001 from Owner 2)
- Owner 4: ~0.000210 ETH (received 0.00001 from Owner 2)

## Features
- ✅ Real-time balance monitoring
- ✅ Automatic error handling and retries
- ✅ Graceful shutdown (Ctrl+C)
- ✅ Batch transfers for efficiency
- ✅ Fallback to individual transfers if batch fails
- ✅ Balance validation before transfers
- ✅ Detailed logging with timestamps
- ✅ Transaction hash tracking with Base Sepolia explorer links

## Safety Features
- Balance checking before transfers to prevent failures
- Graceful error handling with fallback mechanisms
- Detailed logging for monitoring and debugging
- Automatic skipping of transfers when insufficient funds

## Stopping the Service
Press `Ctrl+C` to gracefully stop the cron service.
