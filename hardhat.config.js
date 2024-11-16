require("@nomicfoundation/hardhat-toolbox");
const execSync = require('child_process').execSync;
const { spawn } = require('child_process');

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

task("node", "Run Essential node, you can specify the Node API and Builder API bind addresses")
  // TODO:Start a new terminal
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

    // console.log(output);

    await new Promise(() => { });


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
