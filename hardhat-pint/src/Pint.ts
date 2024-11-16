interface Solution {
  data: Array<{
    predicate_to_solve: {
      contract: string;
      predicate: string;
    };
    decision_variables: any[];
    state_mutations: any[];
  }>;
}

import { execSync } from "child_process";
import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import path from "path";

export class Pint {
  public async compile(
    sourcePath: string
  ): Promise<{ contractAddress: string | null; methodAddress: string | null }> {
    const source = path.join(sourcePath, "src");
    try {
      const output = execSync("pint build", {
        encoding: "utf-8",
        cwd: source,
      });
      const lines = output.toString().split("\n");
      const contractMatch = lines[2].split(" ").pop() || null;
      const methodMatch = lines[3].split(" ").pop() || null;

      return {
        contractAddress: contractMatch,
        methodAddress: methodMatch,
      };
    } catch (error) {
      //   console.error(`Error compiling contracts:`, error);
      return {
        contractAddress: null,
        methodAddress: null,
      };
    }
  }

  public async clean(sourcePath: string): Promise<boolean> {
    try {
      const contractsDir = path.join(sourcePath, "out");
      if (fs.existsSync(contractsDir)) {
        fs.rmSync(contractsDir, { recursive: true });
        return true;
      } else {
        return true;
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
      return false;
    }
  }

  public async deploy(
    sourcePath: string,
    contractName: string,
    url: string = "http://127.0.0.1:3554"
  ): Promise<{
    contractAddress: string | null;
    methodAddress: string | null;
    deploymentHash: string | null;
  }> {

    const contractsDir = path.join(sourcePath, "out/debug");
    const contractFile = `${contractName}.json`;
    const contractPath = path.join(contractsDir, contractFile);

    const result = await this.compile(sourcePath);
    if (!result.contractAddress || !fs.existsSync(contractPath)) {
      throw new Error(
        `Contract file ${contractFile} not found even after compilation`
      );
    }

    try {
      const cmd = `essential-rest-client deploy-contract "${url}" "${contractPath}"`;
      const output = execSync(cmd, { encoding: "utf-8" });
      const address = output.split("\n")[0];
      return {
        contractAddress: result.contractAddress,
        methodAddress: result.methodAddress,
        deploymentHash: address,
      };
    } catch (error) {
      throw new Error(`Error deploying contract ${contractName}: ${error}`);
    }
  }

  public async startNode(
    nodeApiBindAddress: string = "0.0.0.0:3553",
    builderApiBindAddress: string = "0.0.0.0:3554"
  ): Promise<ChildProcess> {

    const builder_tool_cmd = "essential-builder";
    const arg_node_api = `--node-api-bind-address=${nodeApiBindAddress}`;
    const arg_builder_api = `--builder-api-bind-address=${builderApiBindAddress}`;

    const process = spawn(builder_tool_cmd, [arg_node_api, arg_builder_api], {
      stdio: "inherit",
    });

    return new Promise((resolve, reject) => {
      process.on("error", (err) => {
        console.error("Failed to start process:", err);
        reject(err);
      });

      process.on("spawn", () => {
        resolve(process);
      });

      process.on("exit", (code) => {
        if (code !== 0) {
          console.error(`Process exited with code ${code}`);
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  }

  public async queryState(
    contentAddress: string,
    key: string,
    url: string = "http://127.0.0.1:3553"
  ): Promise<string> {
    try {
      const cmd = `essential-rest-client query-state --content-address "${contentAddress}" "${url}" "${key}"`;
      const output = execSync(cmd, { encoding: "utf-8" });
      return output.split("\n")[0];
    } catch (error) {
      throw new Error(
        `Error querying state of contract ${contentAddress}: ${error}`
      );
    }
  }

  public async submitSolution(
    sourcePath: string,
    contractAddress: string,
    methodAddress: string,
    decisionVars: any[],
    stateMutations: any[],
    url: string = "http://127.0.0.1:3554"
  ): Promise<string> {
    try {
      const solution: Solution = {
        data: [
          {
            predicate_to_solve: {
              contract: contractAddress,
              predicate: methodAddress,
            },
            decision_variables: decisionVars,
            state_mutations: stateMutations,
          },
        ],
      };

      const solutionPath = path.join(sourcePath, "solution.json");
      fs.writeFileSync(solutionPath, JSON.stringify(solution, null, 2));

      const cmd = `essential-rest-client submit-solution "${url}" ${solutionPath}`;
      const output = execSync(cmd, { encoding: "utf-8" });
      return output.split("\n")[0];
    } catch (error) {
      throw new Error(
        `Error submitting solution to contract ${contractAddress}: ${error}`
      );
    }
  }
}
