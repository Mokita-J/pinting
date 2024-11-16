# 🎯 Hardhat-Pint Example Project

A demonstration project showcasing smart contract development on Essential blockchain using the hardhat-pint plugin. This project features a simple counter contract that shows the basics of writing, deploying, and testing Pint smart contracts.

## 📁 Project Structure

```
counter/
├── contracts/
│   └── src/
│       └── contract.pnt    # Pint smart contract
├── test/
│   └── counter.test.js     # Integration tests
└── hardhat.config.js       # Hardhat configuration
```

## 💡 Smart Contract

The example includes a straightforward counter contract written in Pint that demonstrates:
- Storage management with an integer counter
- A predicate for incrementing the counter that:
  - Initializes to 1 if unset
  - Increments by 1 if already initialized

## 🛠 Available Commands

### Essential Node Management
```bash
# Start Essential node with default settings
npx hardhat node

# Start with custom bind addresses
npx hardhat node \
  --nodeApiBindAddress "0.0.0.0:3553" \
  --builderApiBindAddress "0.0.0.0:3554"
```

### Contract Development
```bash
# Install project dependencies
npm install

# Compile Pint contracts
npx hardhat compile

# Deploy contracts
npx hardhat deploy --contract <CONTRACT_NAME>

# Deploy to custom network
npx hardhat deploy --contract <CONTRACT_NAME> --url "http://127.0.0.1:3554"

# Clean compiled contracts
npx hardhat clean
```

### Testing
```bash
# Run the integration test suite
npx hardhat test
```

## 🧪 Test Suite Overview

The integration tests perform a complete lifecycle check:

1. 📥 Contract deployment
2. ✅ Deployment verification
3. 🔍 Initial state query
4. 📝 Counter increment execution
5. 🔄 State update verification

## 📚 Learn More

For comprehensive documentation about Essential blockchain and Pint development, visit the [Essential Documentation](https://docs.essential.software/).

---
*Built with ❤️ using Essential blockchain and hardhat-pint*