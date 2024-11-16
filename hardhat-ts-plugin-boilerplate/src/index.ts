import { extendConfig, extendEnvironment, task } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import path from "path";

import { ExampleHardhatRuntimeEnvironmentField } from "./ExampleHardhatRuntimeEnvironmentField";
import { Pint } from "./Pint"
// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
import "./type-extensions";

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    // We apply our default config here. Any other kind of config resolution
    // or normalization should be placed here.
    //
    // `config` is the resolved config, which will be used during runtime and
    // you should modify.
    // `userConfig` is the config as provided by the user. You should not modify
    // it.
    //
    // If you extended the `HardhatConfig` type, you need to make sure that
    // executing this function ensures that the `config` object is in a valid
    // state for its type, including its extensions. For example, you may
    // need to apply a default value, like in this example.
    const userPath = userConfig.paths?.newPath;

    let newPath: string;
    if (userPath === undefined) {
      newPath = path.join(config.paths.root, "newPath");
    } else {
      if (path.isAbsolute(userPath)) {
        newPath = userPath;
      } else {
        // We resolve relative paths starting from the project's root.
        // Please keep this convention to avoid confusion.
        newPath = path.normalize(path.join(config.paths.root, userPath));
      }
    }

    config.paths.newPath = newPath;
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

  

extendEnvironment((hre) => {
  // We add a field to the Hardhat Runtime Environment here.
  // We use lazyObject to avoid initializing things until they are actually
  // needed.
  hre.example = lazyObject(() => new ExampleHardhatRuntimeEnvironmentField());
  hre.pint = lazyObject(() => new Pint());
});
