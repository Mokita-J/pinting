require("@nomicfoundation/hardhat-toolbox");
const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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

task("node", "Run Essential node, you can specify the Node API and Builder API bind addresses")
  .addOptionalParam("nodeApiBindAddress", "Node API bind address", "0.0.0.0:3553")
  .addOptionalParam("builderApiBindAddress", "Builder API bind address", "0.0.0.0:3554")
  .setAction(async (taskArgs) => {
    console.log("Running Essential node...");

    const builder_tool_cmd = 'essential-builder'
    const arg_node_api = `--node-api-bind-address=${taskArgs.nodeApiBindAddress}`
    const arg_builder_api = `--builder-api-bind-address=${taskArgs.builderApiBindAddress}`

    const new_process = spawn(builder_tool_cmd, [arg_node_api, arg_builder_api],
      { stdio: 'inherit' })

    new_process.on('error', (err) => {
      console.error('Failed to start process:', err);
      process.exit(1);
    });

    new_process.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Process exited with code ${code}`);
        process.exit(code);
      }
    });


    await new Promise(() => { });


  });

task("deploy", "Deploy compiled contracts")
  .addParam("contract", "Name of the contract to deploy")
  .setAction(async (taskArgs, hre) => {
    console.log(`Deploying contract: ${taskArgs.contract}...`);
    
    const contractsDir = `${hre.config.paths.sources}/out/debug`;
    try {
      
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

task("clean", "Clean up compiled contracts")
  .setAction(async () => {
    console.log("Cleaning up compiled contracts...");
    const contractsDir = `${hre.config.paths.sources}/out`;
    
    if (fs.existsSync(contractsDir)) {
      fs.rmSync(contractsDir, { recursive: true, force: true });
      console.log("Cleanup completed successfully.");
    } else {
      console.log("No compiled contracts found to clean up.");
    }
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
