import { extendConfig, extendEnvironment, task } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import { Pint } from "./Pint"
// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
import "./type-extensions";

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {

  }
);

// Override the built-in compile task
task("compile", "Compiles Pint smart contracts")
  .setAction(async (_, hre) => {
    console.log("Compiling Pint contracts...");
    try {
      const result = await hre.pint.compile(hre.config.paths.sources);
      if (!result.contractAddress || !result.methodAddress) {
        throw new Error("Compilation failed");
      }
      console.log("Contract Address:", result.contractAddress);
      console.log("Method Address:", result.methodAddress);
      return result;
    } catch (error) {
      // console.error("Compilation failed:", error);
      throw error;
    }
  });

task("deploy", "Deploy compiled Pint contracts")
  .addParam("contract", "Name of the contract to deploy")
  .addOptionalParam("url", "Network URL", "http://127.0.0.1:3554")
  .setAction(async (taskArgs, hre) => {
    try {
      // const url = taskArgs.url || "http://127.0.0.1:3554";
      const result = await hre.pint.deploy(
        hre.config.paths.sources,
        taskArgs.contract,
        taskArgs.url
      );
      return result;
    } catch (error) {
      console.error(`Deployment failed:`, error);
      throw error;
    }
  });

task("clean", "Removes the Pint compiled contracts directory")
  .setAction(async function (_, { config }) {
    const pint = new Pint();
    const sourcePath = config.paths.sources;
    await pint.clean(sourcePath);
  });

task("node", "Run Essential node, you can specify the Node API and Builder API bind addresses")
  .addOptionalParam("nodeApiBindAddress", "Node API bind address", "0.0.0.0:3553")
  .addOptionalParam("builderApiBindAddress", "Builder API bind address", "0.0.0.0:3554")
  .setAction(async (taskArgs, hre) => {
    try {
      const process = await hre.pint.startNode(
        taskArgs.nodeApiBindAddress,
        taskArgs.builderApiBindAddress
      );

      // Keep the process running
      await new Promise((resolve) => {
        process.on('close', resolve);
      });
    } catch (error) {
      console.error('Error starting node:', error);
      process.exit(1);
    }
  });



extendEnvironment((hre) => {
  hre.pint = lazyObject(() => new Pint());
});
