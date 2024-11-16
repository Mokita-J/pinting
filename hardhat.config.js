require("@nomicfoundation/hardhat-toolbox");
const execSync = require('child_process').execSync;

// TODO: override tasks-> compile, node, deploy, test, init

const compilePintContracts = async (hre) => {
  console.log("Compiling pint smart contracts...");
  try {
    const output = execSync('pint build', { 
      encoding: 'utf-8',
      cwd: hre.config.paths.sources
    });
    console.log(output);
    return true;
  } catch (error) {
    console.error(`Error compiling contracts:`, error.message);
    return false;
  }
};

task("compile", "Compile pint smart contracts")
  .setAction(async (taskArgs, hre) => {
    await compilePintContracts(hre);
  });

task("node", "Run Essential node")
  .setAction(async () => {
    console.log("Running Essential node...");
    //TODO: print the output
    const cmd = 'essential-builder --node-api-bind-address "0.0.0.0:3553" --builder-api-bind-address "0.0.0.0:3554"';
    const output = execSync(cmd, { encoding: 'utf-8' });
    console.log(output);

  });

task("deploy", "Deploy compiled contracts")
  .addParam("contract", "Name of the contract to deploy")
  .setAction(async (taskArgs, hre) => {
    console.log(`Deploying contract: ${taskArgs.contract}...`);
    
    const contractsDir = `${hre.config.paths.sources}/out/debug`;
    try {
      const fs = require('fs');
      const path = require('path');
      
      const contractFile = `${taskArgs.contract}.json`;
      const contractPath = path.join(contractsDir, contractFile);
      
      if (!fs.existsSync(contractPath)) {
        console.log(`Contract file not found. Attempting to compile first...`);
        const success = await compilePintContracts(hre);
        if (!success || !fs.existsSync(contractPath)) {
          throw new Error(`Contract file ${contractFile} not found in ${contractsDir} even after compilation`);
        }
      }

      const url = hre.network.config.url ? hre.network.config.url : "http://127.0.0.1:3554";
      console.log(`Using network: ${url}`);
      
      const cmd = `essential-rest-client deploy-contract "${url}" "${contractPath}"`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      console.log(output);
      
    } catch (error) {
      console.error(`Error deploying contract ${taskArgs.contract}:`, error.message);
    }
  });

task("test", "Run test")
  .setAction(async () => {
    console.log("Running test...");
  });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    essential: {
      url: "https://node.essential.builders",
      accounts: [],
      chainId: 5197,
      gasPrice: "auto",
      timeout: 20000
    },
    local: {
      url: "http://127.0.0.1:3554",
      accounts: [],
      chainId: 5197,
      gasPrice: "auto",
      timeout: 20000
    }
  }
};
