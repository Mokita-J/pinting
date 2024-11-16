# Hardhat Pint

A Hardhat plugin for Pint - the declarative programming language for smart contracts on Essential Blockchain.

This plugin integrates Pint into your Hardhat development workflow, allowing you to abstract yourself from the each SDK tools of Essential and use the Hardhat CLI.

## Features

- Configurable formatting rules
- Integration with Hardhat tasks
- Format on compile option
- CI-friendly command line interface

## Installation

```bash
npm install --save-dev hardhat-pint
```

## Usage

Import the plugin in your `hardhat.config.js`:

```javascript
require("hardhat-pint");
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```typescript
import "hardhat-pint";
```

## Tasks

This plugin adds the following tasks to Hardhat:

- `pint`: Formats all Solidity files in your project
- `pint:check`: Checks if files are formatted without making changes

```bash
npx hardhat pint
npx hardhat pint:check
```

## Configuration

Add a `pint` entry to your `hardhat.config.js` or `hardhat.config.ts`:

```typescript
module.exports = {
  pint: {
    preset: "default",
    formatOnCompile: true,
    // Additional Pint configuration options...
  }
};
```