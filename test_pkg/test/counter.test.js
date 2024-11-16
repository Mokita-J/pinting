const { expect } = require('chai');
const path = require('path');
const { execSync } = require('child_process');
// const { deployContract, queryState, submitSolution } = require('./helpers');
const findProcess = require('find-process');
const { spawn } = require('child_process');


describe('Counter Contract', () => {
  const sourcePath = path.join(__dirname, '../contracts');
  const contractName = 'counter';

  before(async () => {
    try {
      execSync('nc -zv 0.0.0.0 3554', { stdio: 'inherit' });
      console.log('^.^ Node is running...');
    } catch (error) {
      console.error('Node is not running: ', error.message);
      console.log('^.^ Starting node...');
      // execSync('npx hardhat node');
      hardhatProcess = spawn('npx', ['hardhat', 'node'], {
        detached: true,
        stdio: 'ignore'
      });
      try {
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('Error during node startup:', error.message);
        throw error;
      }
    }
  });

  after(async () => {
    // Kill the Hardhat node process
    try {
      const node_list = await findProcess('port', 3553);
      // const builder_list = await findProcess('port', 3554);
      if (node_list.length) {
        execSync(`kill -9 ${node_list[0].pid}`, { stdio: 'ignore' });
        console.log('Hardhat node stopped >.<');
      }
    } catch (error) {
      console.error('Error stopping Hardhat node:', error.message);
    }
  });

  it('should deploy successfully', async () => {
    const contractInfo = await hre.pint.deploy(sourcePath, contractName);
    expect(contractInfo.contractAddress).to.be.equal('1899743AA94972DDD137D039C2E670ADA63969ABF93191FA1A4506304D4033A2');
    expect(contractInfo.methodAddress).to.be.equal('355A12DCB600C302FFD5D69C4B7B79E60BA3C72DDA553B7D43F4C36CB7CC0948');
    expect(contractInfo.deploymentHash).to.be.equal('1FD5247B6DBB3C79CA875FD54894F71F0840F38E469D5A2270BD8AE02FBF22FA');

    const state = await hre.pint.queryState(contractInfo.contractAddress, "0000000000000000");
    expect(state).to.be.equal('null');

    const mutations = [{ key: [0], value: [1] }];

    const solution = await hre.pint.submitSolution(hre.config.paths.sources, contractInfo.contractAddress, contractInfo.methodAddress, [], mutations);
    expect(solution).to.be.equal("68A1BC8E7A5E6789E8DE4BC59A7ADD0BFC5AF7FA591FCC03CEBE6E4754C13CA1");
    // wait for the state to be updated
    await new Promise(resolve => setTimeout(resolve, 1000));
    const postState = await hre.pint.queryState(contractInfo.contractAddress, "0000000000000000");
    expect(postState).to.be.equal('[1]');
  });
});