interface Solution {
  data: {
    predicate_to_solve: {
      contract: string;
      predicate: string;
    };
    decision_variables: any[];
    state_mutations: any[];
  }[];
}

// Create a new file for the Pint compiler functionality
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

export class Pint {
  async compile(sourcePath: string): Promise<{ contractAddress: string | null, methodAddress: string | null }> {
    console.log("Compiling pint smart contracts...");
    const source = path.join(sourcePath, 'src')
    try {
      const output = execSync('pint build', {
        encoding: 'utf-8',
        cwd: source
      });
      //   console.log(output);
      const lines = output.toString().split('\n');
      const contractMatch = lines[2].split(' ').pop() || null;
      const methodMatch = lines[3].split(' ').pop() || null;

      return {
        contractAddress: contractMatch,
        methodAddress: methodMatch
      };
    } catch (error) {
      //   console.error(`Error compiling contracts:`, error);
      return {
        contractAddress: null,
        methodAddress: null
      };
    }
  }

  async clean(sourcePath: string): Promise<boolean> {
    console.log("Cleaning up compiled contracts...");
    try {
      const contractsDir = path.join(sourcePath, 'out');
      if (fs.existsSync(contractsDir)) {
        fs.rmSync(contractsDir, { recursive: true });
        console.log("Cleanup completed successfully.");
        return true;
      } else {
        console.log("No compiled contracts found to clean up.");
        return true;
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
      return false;
    }
  }

  async deploy(sourcePath: string, contractName: string, url: string = "http://127.0.0.1:3554"): Promise<{ contractAddress: string | null, methodAddress: string | null, deploymentHash: string | null }> {
    console.log(`Deploying contract: ${contractName}...`);

    const contractsDir = path.join(sourcePath, 'out/debug');
    const contractFile = `${contractName}.json`;
    const contractPath = path.join(contractsDir, contractFile);
    console.log(contractPath)

    const result = await this.compile(sourcePath);
    if (!result.contractAddress || !fs.existsSync(contractPath)) {
      throw new Error(`Contract file ${contractFile} not found even after compilation`);
    }

    try {
      console.log(`Using network: ${url}`);
      const cmd = `essential-rest-client deploy-contract "${url}" "${contractPath}"`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      const address = output.split('\n')[0];
      console.log('Deployment output:', output);
      return { contractAddress: result.contractAddress, methodAddress: result.methodAddress, deploymentHash: address };
    } catch (error) {
      throw new Error(`Error deploying contract ${contractName}: ${error}`);
    }
  }

  async startNode(nodeApiBindAddress: string = "0.0.0.0:3553",
    builderApiBindAddress: string = "0.0.0.0:3554"): Promise<ChildProcess> {
    console.log("Running Essential node...");

    const builder_tool_cmd = 'essential-builder';
    const arg_node_api = `--node-api-bind-address=${nodeApiBindAddress}`;
    const arg_builder_api = `--builder-api-bind-address=${builderApiBindAddress}`;

    const process = spawn(builder_tool_cmd, [arg_node_api, arg_builder_api], {
      stdio: 'inherit'
    });

    return new Promise((resolve, reject) => {
      process.on('error', (err) => {
        console.error('Failed to start process:', err);
        reject(err);
      });

      process.on('spawn', () => {
        resolve(process);
      });

      process.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Process exited with code ${code}`);
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  }

  async queryState(contentAddress: string, key: string, url: string = "http://127.0.0.1:3553"): Promise<string> {
    console.log(`Querying state of contract: ${contentAddress}...`);
    try {
      const cmd = `essential-rest-client query-state --content-address "${contentAddress}" "${url}" "${key}"`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      console.log('Query state output:', output);
      return output.split('\n')[0];
    } catch (error) {
      throw new Error(`Error querying state of contract ${contentAddress}: ${error}`);
    }
  }

  async submitSolution(
    sourcePath: string,
    contractAddress: string,
    methodAddress: string,
    decisionVars: any[],
    stateMutations: any[],
    url: string = "http://127.0.0.1:3554"
  ): Promise<string> {
    console.log(`Submitting solution to contract: ${contractAddress}...`);
    try {
      const solution: Solution = {
        data: [{
          predicate_to_solve: {
            contract: contractAddress,
            predicate: methodAddress
          },
          decision_variables: decisionVars,
          state_mutations: stateMutations
        }]
      };

      const solutionPath = path.join(sourcePath, 'solution.json');
      fs.writeFileSync(solutionPath, JSON.stringify(solution, null, 2));

      const cmd = `essential-rest-client submit-solution "${url}" ${solutionPath}`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      console.log('Submit solution output:', output);
      return output.split('\n')[0];
    } catch (error) {
      throw new Error(`Error submitting solution to contract ${contractAddress}: ${error}`);
    }
  }
}