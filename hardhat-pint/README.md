# Hardhat Pint

A Hardhat plugin that integrates Pint (a declarative smart contract language) with your Essential Blockchain development workflow. Write, compile, and deploy Pint contracts using familiar Hardhat commands.

## Prerequisites

Before using this plugin, ensure you have the following installed:

### Rust Tools
- [Pint](https://github.com/essential-contributions/pint) - The Pint CLI
  ```bash
  cargo install pint-cli
  ```
- [Essential Rest Client](https://github.com/essential-contributions/essential-integration/tree/main/crates/essential-rest-client) - Essential's REST client
  ```bash
  cargo install essential-rest-client
  ```

### Node.js Tools
- [Node.js](https://nodejs.org/) (v14 or later)
- [Hardhat](https://hardhat.org/) - Ethereum development environment
  ```bash
  npm install --save-dev hardhat
  ```

## Features

- 🔧 Seamless integration with Hardhat CLI
- 🧪 Simple testing interface with Mocha
- 📦 Support for both local and remote nodes
- 🛠️ Essential tasks: compile, deploy, test, clean, node

## Installation

```bash
# Create a new Hardhat project (if needed)
npx hardhat init

# Install the plugin
npm install hardhat-pint
```

## Configuration

Add the plugin to your Hardhat config file:

```javascript
// hardhat.config.js
require("hardhat-pint");
```

```typescript
// hardhat.config.ts
import "hardhat-pint";
```

## Available Commands

```bash
# Compile your Pint contracts
npx hardhat compile

# Start a local Essential node
npx hardhat node

# Deploy a contract
npx hardhat deploy --contract <contract-name> [--url <node-url>]

# Run tests
npx hardhat test

# Clean compiled contracts
npx hardhat clean
```

## Testing Guide

The plugin provides testing helpers for writing Mocha tests. Here's a basic example:

```javascript
const { deploy, queryState, submitSolution } = require("hardhat-pint");

describe("Counter Contract", () => {
  it("should increment counter value", async () => {
    // Deploy the contract
    const [contractHash, IncrementHash] = await deploy(sourcePath, contractName);
    
    // Query initial state
    const initialState = await queryState(contractHash, key);
    
    // Submit a solution
    const solution = await submitSolution(
      hre.config.paths.sources,
      contractHash,
      IncrementHash,
      [],
      mutations
    );
    
    // Verify the new state
    const newState = await queryState(contractHash, key);
    expect(newState).to.not.equal(initialState);
  });
});
```

## Default Configuration

- Local node URL: `http://localhost:3554`
- Supported networks: Local and remote Essential nodes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


