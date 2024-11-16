// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";
import path from "path";
import fs from "fs";


import { ExampleHardhatRuntimeEnvironmentField } from "../src/ExampleHardhatRuntimeEnvironmentField";

import { useEnvironment } from "./helpers";

describe("Integration tests examples", function () {
  describe("Hardhat Runtime Environment extension", function () {
    useEnvironment("hardhat-project");

    it("Should add the example field", function () {
      assert.instanceOf(
        this.hre.example,
        ExampleHardhatRuntimeEnvironmentField
      );
    });

    it("The example field should say hello", function () {
      assert.equal(this.hre.example.sayHello(), "hello");
    });
  });

  describe("HardhatConfig extension", function () {
    useEnvironment("hardhat-project");

    it("Should add the newPath to the config", function () {
      assert.equal(
        this.hre.config.paths.newPath,
        path.join(process.cwd(), "asd")
      );
    });
  });
});

describe("Unit tests examples", function () {
  describe("ExampleHardhatRuntimeEnvironmentField", function () {
    describe("sayHello", function () {
      it("Should say hello", function () {
        const field = new ExampleHardhatRuntimeEnvironmentField();
        assert.equal(field.sayHello(), "hello");
      });
    });
  });
});

describe("Pint compilation", function() {
  useEnvironment("hardhat-project");

  afterEach("Resetting hardhat", function() {
    const outPath = path.join(this.hre.config.paths.sources, 'out');
    if (fs.existsSync(outPath)) {
      fs.rmdirSync(outPath, {recursive: true})
    }
  });

  it("should compile Pint contracts successfully", async function() {

    // Access the compilation result through hre.pint
    const path = this.hre.config.paths.sources;
    const result = await this.hre.pint.compile(path);
    // Assert the compilation produced valid addresses
    assert.isNotNull(result.contractAddress, "Contract address should not be null");
    assert.isNotNull(result.methodAddress, "Method address should not be null");
  });

  it("should handle compilation failures gracefully", async function() {
    // Test with invalid source path
    const invalidResult = await this.hre.pint.compile("invalid/path");
    
    assert.isNull(invalidResult.contractAddress, "Contract address should be null for failed compilation");
    assert.isNull(invalidResult.methodAddress, "Method address should be null for failed compilation");
  });

  it("should compile contracts successfully", async function() {
    try {
      // Run the compile task
      const result = await this.hre.run("compile");
      
      // Verify the result
      assert.exists(result, "Compilation result should exist");
      assert.exists(result.contractAddress, "Contract address should exist");
      assert.exists(result.methodAddress, "Method address should exist");
      
      // Optional: More specific checks
      assert.match(result.contractAddress, /^[a-zA-Z0-9]+$/, "Contract address should be alphanumeric");
      assert.match(result.methodAddress, /^[a-zA-Z0-9]+$/, "Method address should be alphanumeric");
    } catch (error) {
      assert.fail(`Compilation should not throw error: ${error}`);
    }
  });

  it("should handle compilation failures", async function() {
    // Temporarily change the source path to trigger a failure
    const originalPath = this.hre.config.paths.sources;
    this.hre.config.paths.sources = "invalid/path";

    try {
      await this.hre.run("compile");
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.exists(error, "Should throw an error for invalid compilation");
    } finally {
      // Restore the original path
      this.hre.config.paths.sources = originalPath;
    }
  });

  describe("PintCompiler", function() {
    it("should be available in the Hardhat Runtime Environment", function() {
      assert.exists(this.hre.pint, "hre.pint should exist");
      assert.isFunction(this.hre.pint.compile, "hre.pint.compile should be a function");
    });
  });
});

describe("Pint deployment", function() {
  useEnvironment("hardhat-project");

  afterEach("Resetting hardhat", function() {
    const outPath = path.join(this.hre.config.paths.sources, 'out');
    if (fs.existsSync(outPath)) {
      fs.rmdirSync(outPath, {recursive: true})
    }
  });

  it("should deploy contracts successfully", async function() {
    try {
      const url = "http://127.0.0.1:3554";
      const result = await this.hre.pint.deploy(
        this.hre.config.paths.sources,
        "counter",
        url
      );
      assert.exists(result, "Deployment result should exist");
      assert.exists(result.deploymentHash, "Deployment hash should exist");
    } catch (error) {
      assert.fail(`Deployment should not throw error: ${error}`);
    }
  });

  it("should handle deployment failures", async function() {
    try {
      // Test with invalid URL to trigger failure
      const result = await this.hre.pint.deploy(
        this.hre.config.paths.sources,
        "counter",
        "invalid-url"
      );
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.exists(error, "Should throw an error for invalid deployment");
    }
  });

  describe("PintDeployer", function() {
    it("should be available in the Hardhat Runtime Environment", function() {
      assert.exists(this.hre.pint, "hre.pint should exist");
      assert.isFunction(this.hre.pint.deploy, "hre.pint.deploy should be a function");
    });
  });
});

describe("clean task", function() {
  useEnvironment("hardhat-project");
  
  it("should remove the contracts directory", async function() {
    // Setup test environment
    
    // Create a test directory with a dummy file
    const contractsDir = path.join(__dirname, "fixture-projects/hardhat-project/contracts/out");
    fs.mkdirSync(contractsDir);
    fs.writeFileSync(path.join(contractsDir, "test.txt"), "test");
    
    // Verify directory exists
    assert.isTrue(fs.existsSync(contractsDir));
    
    // Run clean task
    await this.hre.run("clean");
    
    // Verify directory was removed
    assert.isFalse(fs.existsSync(contractsDir));
  });
});
