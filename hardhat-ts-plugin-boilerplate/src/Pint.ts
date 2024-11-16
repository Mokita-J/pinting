// Create a new file for the Pint compiler functionality
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export class Pint {
  async compile(sourcePath: string): Promise<{contractAddress: string | null, methodAddress: string | null}> {
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
        fs.rmSync(contractsDir, {recursive: true});
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

  async deploy(sourcePath: string, contractName: string, url: string = "http://127.0.0.1:3554"): Promise<{contractAddress: string | null, methodAddress: string | null, deploymentHash: string | null}> {
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
}