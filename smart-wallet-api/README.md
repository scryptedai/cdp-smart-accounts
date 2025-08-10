# Smart Wallet API

A comprehensive NestJS TypeScript API for managing Coinbase CDP Smart Accounts with spending limits, paymaster gas sponsorship, and swap functionality.

## 🚀 Features

- **Smart Account Management**: Create and manage CDP Smart Accounts
- **Spending Limits**: Enforce spending limits between accounts (0.00005 ETH limit)
- **Paymaster Gas Sponsorship**: Gas-free transactions using Coinbase paymaster
- **Token Swaps**: Execute swaps on Base mainnet
- **Balance Management**: Check balances across EOAs and Smart Accounts
- **Faucet Integration**: Request testnet funds
- **Validation**: Comprehensive input validation and error handling

## 🏗️ Architecture

### Smart Accounts
- **Smart Account 1**: `0x382d233262Fc9737188B6F6b2a25a24e05319F5E`
- **Smart Account 2**: `0x55f7415B24eA71537d8E4b9Cb09Dc8244D36f231`

### Spending Limits
- **Limit**: 0.00005 ETH (50% of original 0.0001 ETH balance)
- **Authorized Spender**: Smart Account 2 can spend from Smart Account 1
- **Validation**: Pre-transaction validation prevents excessive spending

### Networks
- **Testnet**: Base Sepolia (`base-sepolia`)
- **Mainnet**: Base (`base`)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Start production server
npm run start:prod
```

## 📚 API Endpoints

### Health Check
```http
GET /api/smart-wallet/health
```

### Balance Management
```http
# Get all balances
GET /api/smart-wallet/balances?network=base-sepolia

# Get specific owner balance
GET /api/smart-wallet/balances/owner1?network=base-sepolia
```

### Faucet Requests
```http
POST /api/smart-wallet/faucet
Content-Type: application/json

{
  "ownerType": "owner1",
  "token": "eth",
  "network": "base-sepolia"
}
```

### Transfers
```http
POST /api/smart-wallet/transfer
Content-Type: application/json

{
  "fromOwner": "owner1",
  "toAddress": "0x55f7415B24eA71537d8E4b9Cb09Dc8244D36f231",
  "amountWei": "50000000000000",
  "network": "base-sepolia",
  "usePaymaster": true
}
```

### Swap Price Estimation
```http
POST /api/smart-wallet/swap/price
Content-Type: application/json

{
  "fromToken": "0x4200000000000000000000000000000000000006",
  "toToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "fromAmountWei": "1000000000000000",
  "takerAddress": "0x382d233262Fc9737188B6F6b2a25a24e05319F5E",
  "network": "base"
}
```

### Execute Swap
```http
POST /api/smart-wallet/swap
Content-Type: application/json

{
  "ownerType": "owner1",
  "fromToken": "0x4200000000000000000000000000000000000006",
  "toToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "fromAmountWei": "1000000000000000",
  "slippageBps": "100",
  "network": "base"
}
```

### Spending Limit Validation
```http
POST /api/smart-wallet/spending-limit/validate
Content-Type: application/json

{
  "ownerType": "owner2",
  "amountWei": "30000000000000"
}
```

### Configuration
```http
GET /api/smart-wallet/config
```

### Smart Account Info
```http
GET /api/smart-wallet/smart-accounts
```

### Demo: Spending Limit Test
```http
POST /api/smart-wallet/demo/spending-limit-test
```

## 🧪 Testing the API

### 1. Start the Server
```bash
npm run start:dev
```

### 2. Health Check
```bash
curl http://localhost:3000/api/smart-wallet/health
```

### 3. Check Balances
```bash
curl http://localhost:3000/api/smart-wallet/balances
```

### 4. Test Spending Limit
```bash
curl -X POST http://localhost:3000/api/smart-wallet/demo/spending-limit-test \
  -H "Content-Type: application/json"
```

### 5. Validate Spending Amount
```bash
# Valid amount (should pass)
curl -X POST http://localhost:3000/api/smart-wallet/spending-limit/validate \
  -H "Content-Type: application/json" \
  -d '{"ownerType": "owner2", "amountWei": "30000000000000"}'

# Excessive amount (should fail)
curl -X POST http://localhost:3000/api/smart-wallet/spending-limit/validate \
  -H "Content-Type: application/json" \
  -d '{"ownerType": "owner2", "amountWei": "100000000000000000"}'
```

### 6. Execute Transfer with Paymaster
```bash
curl -X POST http://localhost:3000/api/smart-wallet/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromOwner": "owner1",
    "toAddress": "0x55f7415B24eA71537d8E4b9Cb09Dc8244D36f231",
    "amountWei": "10000000000000",
    "network": "base-sepolia",
    "usePaymaster": true
  }'
```

## 🔧 Configuration

### Environment Variables
```env
PORT=3000
```

### CDP Configuration
All CDP configuration is in `src/config/cdp.config.ts`:
- API credentials
- Owner account details
- Smart Account addresses
- Network configurations
- Token addresses
- Paymaster URL

## 📊 Key Features Demonstrated

### ✅ Spending Limits
- Smart Account 2 can only spend up to 0.00005 ETH from Smart Account 1
- Pre-transaction validation prevents excessive spending
- Unauthorized spenders are blocked

### ✅ Paymaster Gas Sponsorship
- Transactions can be sponsored by Coinbase paymaster
- No gas fees deducted from user accounts
- Seamless user experience

### ✅ Smart Account Operations
- Create and manage Smart Accounts
- Execute user operations
- Handle account abstraction (ERC-4337)

### ✅ Token Swaps
- Get real-time swap prices on Base mainnet
- Execute swaps with slippage protection
- Support for WETH ↔ USDC swaps

### ✅ Comprehensive API
- RESTful endpoints for all operations
- Input validation and error handling
- Detailed response formatting
- Transaction explorer links

## 🚀 Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm run start:prod
   ```

3. **Environment Configuration**:
   - Set `PORT` environment variable
   - Configure logging levels
   - Set up monitoring and health checks

## 🔗 Related Documentation

- [Coinbase CDP Documentation](https://docs.cdp.coinbase.com/)
- [Base Network Information](https://docs.base.org/)
- [ERC-4337 Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
- [NestJS Documentation](https://nestjs.com/)

## 📝 API Response Examples

### Balance Response
```json
{
  "ownerType": "owner1",
  "ownerAddress": "0x43451967B63410E569D0ea94d83AaE137d6Bca59",
  "smartAccountAddress": "0x382d233262Fc9737188B6F6b2a25a24e05319F5E",
  "eoaBalances": [],
  "smartAccountBalances": [
    {
      "token": {
        "symbol": "ETH",
        "decimals": 18,
        "contractAddress": "0x0000000000000000000000000000000000000000"
      },
      "amount": {
        "amount": "50000000000000"
      }
    }
  ]
}
```

### Transfer Response
```json
{
  "fromOwner": "owner1",
  "fromAddress": "0x382d233262Fc9737188B6F6b2a25a24e05319F5E",
  "toAddress": "0x55f7415B24eA71537d8E4b9Cb09Dc8244D36f231",
  "amountWei": "50000000000000",
  "userOpHash": "0xe8c5a7d8812515baf22798dd646df6f7a3e8f88bd731541bb34138fcace91735",
  "transactionHash": "0x057b725fa6bc6870aea6beb001f8f1fe0771504f529e902b1824224731027549",
  "status": "complete",
  "usePaymaster": true,
  "explorerUrl": "https://sepolia.basescan.org/tx/0x057b725fa6bc6870aea6beb001f8f1fe0771504f529e902b1824224731027549"
}
```

## 🎯 Success Metrics

- ✅ **2 Smart Accounts** created and operational
- ✅ **Spending limits** enforced (0.00005 ETH max)
- ✅ **Paymaster integration** working (gas-free transactions)
- ✅ **Real transactions** executed on Base Sepolia
- ✅ **Comprehensive API** with all functionality
- ✅ **Production-ready** NestJS application