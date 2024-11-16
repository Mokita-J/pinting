# Hardhat Pint

A Hardhat plugin for Pint - the declarative programming language for smart contracts on Essential Blockchain.

This plugin integrates Pint into your Hardhat development workflow, allowing you to abstract yourself from the each SDK tools of Essential and use the Hardhat CLI.

## Features

- Easy-to-use testing interface
- Integration with Hardhat tasks(compile, deploy, test, clean, node)
- Support for both local and remote nodes


## Installation

1. Start a new project with Hardhat:
```bash
npx hardhat init
```

2. Install the plugin:
```bash
npm install hardhat-pint
```

## Usage
### JavaScript
Add the plugin to your `hardhat.config.js`:

```javascript
require("hardhat-pint");
```
### TypeScript
Add the plugin to your `hardhat.config.ts`:

```typescript
import "hardhat-pint";
```


### Example usage
```bash
npx hardhat compile Compiles Pint smart contracts

npx hardhat node   Run Essential node, you can specify the Node API and Builder API bind addresses

npx hardhat deploy --contract <contract-name> [--url <node-url>] Deploy compiled Pint contracts to the specified node(default: http://localhost:3554)

npx hardhat test    Runs mocha tests

npx hardhat clean   Removes the Pint compiled contracts directory
```

### Testing Interface
For plugin developers or contributors, we provide testing helpers to simplify the testing process. It can be used to write mocha tests for your contracts.

Example:
```javascript
  const { deploy, queryState, submitSolution } = require("hardhat-pint");

  it('Test Pint contract: counter', async () => {
    const contractHash, IncrementHash = await deploy(sourcePath, contractName);
    expect(contractHash).to.be.equal(...);
    expect(IncrementHash).to.be.equal(...);
    const state = await queryState(contractHash, key);
    expect(state).to.be.equal(...);
   ...
    const solution = await submitSolution(hre.config.paths.sources, contractHash, IncrementHash, [], mutations);
    expect(solution).to.be.equal(...);
    const postState = await queryState(contractHash, key);
    expect(postState).to.be.equal(...);
  });
```


