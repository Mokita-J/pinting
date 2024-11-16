require("@nomicfoundation/hardhat-toolbox");
const execSync = require('child_process').execSync;
// TODO: override tasks-> compile, node, deploy, test, init

task("compile", "Compile pint smart contracts")
  .setAction(async (taskArgs, hre) => {
    console.log("Compiling pint smart contracts...");

    const contractsDir = hre.config.paths.sources;
    try {
        const output = execSync('pint build', { 
          encoding: 'utf-8',
          cwd: contractsDir
        });
        console.log(output);
    } catch (error) {
        console.error(`Error compiling contracts from ${contractsDir}:`, error.message);
    }
  });

task("node", "Run Essential node")
  .setAction(async () => {
    console.log("Running Essential node...");
    //TODO: print the output
    const cmd = 'essential-builder --node-api-bind-address "0.0.0.0:3553" --builder-api-bind-address "0.0.0.0:3554"';
    const output = execSync(cmd, { encoding: 'utf-8' });
    console.log(output);

  });

task("deploy", "Run Ignition node")
  .setAction(async () => {
    console.log("Deploy contract...");
    // TODO: transfer this to ignition after some research about it
    // TODO: generalize for a contract
    const contract_path = '/home/hackathon/pint-project/counter/contract/out/debug/counter.json';
    const cmd = 'essential-rest-client deploy-contract "http://127.0.0.1:3554" ' + contract_path;
    const output = execSync(cmd, { encoding: 'utf-8' });
    console.log(output);
  });

task("test", "Run test")
  .setAction(async () => {
    console.log("Running test...");
  });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
};
