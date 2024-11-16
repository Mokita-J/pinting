const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
* Compiles Pint smart contracts in the specified source directory
 * @param {string} sourcePath - Path to the source directory containing contracts
 * @returns {Promise<object>} Object containing contract and method addresses
 */
async function compilePintContracts(sourcePath) {
  console.log("Compiling pint smart contracts...");
  try {
    const output = execSync('pint build', {
      encoding: 'utf-8',
      cwd: sourcePath
    });

    console.log(output);
    let l = output.split('\n');
    let s = l[2].split(' ');
    const contractMatch = s[s.length - 1];
    s = l[3].split(' ');
    const methodMatch = s[s.length - 1];

    return {
      contractAddress: contractMatch,
      methodAddress: methodMatch
    };
  } catch (error) {
    console.error(`Error compiling contracts:`, error.message);
    return {
      contractAddress: null,
      methodAddress: null
    };
  }
}

/**
 * Deploys a contract to the local network
 * @param {string} contractName - Name of the contract to deploy
 * @param {string} sourcePath - Path to the source directory containing contracts
 * @param {string} [url="http://127.0.0.1:3554"] - URL of the network to deploy to
 * @returns {Promise<object>} Object containing contract and method addresses
 */
async function deployContract(contractName, sourcePath, url = "http://127.0.0.1:3554") {
  console.log(`Deploying contract: ${contractName}...`);

  const contractsDir = path.join(sourcePath, 'out/debug');
  const contractFile = `${contractName}.json`;
  const contractPath = path.join(contractsDir, contractFile);

  const contractInfo = await compilePintContracts(sourcePath);
  if (!contractInfo.contractAddress || !fs.existsSync(contractPath)) {
    throw new Error(`Contract file ${contractFile} not found in ${contractsDir} even after compilation`);
  }

  try {
    console.log(`Using network: ${url}`);
    const cmd = `essential-rest-client deploy-contract "${url}" "${contractPath}"`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    console.log('Deployment output:', output);
    let l = output.split('\n')[0];

    return { contractAddress: contractInfo.contractAddress, methodAddress: contractInfo.methodAddress, address: l };

  } catch (error) {
    throw new Error(`Error deploying contract ${contractName}: ${error.message}`);
  }
}

async function queryState(contentAddress, key, url = "http://127.0.0.1:3553") {
  console.log(`Querying state of contract: ${contentAddress}...`);
  try {
    const cmd = `essential-rest-client query-state --content-address "${contentAddress}" "${url}" "${key}"`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    console.log('Query state output:', output);
    return output.split('\n')[0];
  } catch (error) {
    throw new Error(`Error querying state of contract ${contentAddress}: ${error.message}`);
  }
}

async function submitSolution(contractAddress, methodAddress, decisionVars, stateMutations, url = "http://127.0.0.1:3554") {
  console.log(`Submitting solution to contract: ${contractAddress}...`);
  try {
    // essential-rest-client submit-solution "http://127.0.0.1:3554" ./solution.json
    // create solution.json
    const predicate = {
      contract: contractAddress,
      predicate: methodAddress
    };
    const entry = {
      predicate_to_solve: predicate,
      decision_variables: decisionVars,
      state_mutations: stateMutations
    };

    const solution = {
      data: [entry]
    }
    const solutionPath = path.join(__dirname, `./solution.json`);
    fs.writeFileSync(solutionPath, JSON.stringify(solution, null, 2));
    const cmd = `essential-rest-client submit-solution "${url}" ${solutionPath}`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    console.log('Submit solution output:', output);
    return output.split('\n')[0];
  } catch (error) {
    throw new Error(`Error submitting solution to contract ${contractAddress}: ${error.message}`);
  }
}

module.exports = {
  compilePintContracts,
  deployContract,
  queryState,
  submitSolution
};