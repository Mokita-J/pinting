const { expect } = require('chai');
const path = require('path');
const { execSync } = require('child_process');
const findProcess = require('find-process');
const { spawn } = require('child_process');


describe('Counter Smart Contract', () => {
  const sourcePath = path.join(__dirname, '../contracts');
  const contractName = 'counter';

  before(async () => {
    try {
      execSync('nc -zv 0.0.0.0 3554', { stdio: 'pipe' });
      console.log('      🔄 Node running\n');
    } catch (error) {
      console.log('      🚀 Starting node...\n');
      hardhatProcess = spawn('npx', ['hardhat', 'node'], {
        detached: true,
        stdio: 'ignore'
      });
      try {
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('      ✨ Node ready\n');
      } catch (error) {
        console.error('      ❌ Node startup failed:', error.message, '\n');
        throw error;
      }
    }
  });

  after(async () => {
    try {
      const node_list = await findProcess('port', 3553);
      if (node_list.length) {
        execSync(`kill -9 ${node_list[0].pid}`, { stdio: 'ignore' });
        console.log('      ✨ Node stopped\n');
      }
    } catch (error) {
      console.error('❌ Stop failed:', error.message);
    }
  });

  describe('Deployment & State Management', () => {
    it('should deploy successfully and increment counter to 1', async () => {
      console.log('      📄 Deploying contract...\n');
      const contractInfo = await hre.pint.deploy(sourcePath, contractName);
      console.log('      ✨ Deployed\n');
      expect(contractInfo.contractAddress).to.not.be.null;
      expect(contractInfo.methodAddress).to.not.be.null;
      expect(contractInfo.deploymentHash).to.not.be.null;
      
      const key = "0000000000000000";
      const state = await hre.pint.queryState(contractInfo.contractAddress, key);
      expect(state).to.be.equal('null');

      const mutations = [{ key: [0], value: [1] }];

      const solution = await hre.pint.submitSolution(hre.config.paths.sources, contractInfo.contractAddress, contractInfo.methodAddress, [], mutations);
      expect(solution).to.not.be.null;
      console.log('      .. Waiting for state update...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
      const postState = await hre.pint.queryState(contractInfo.contractAddress, key);
      console.log('      ✨ State updated\n');
      expect(postState).to.be.equal('[1]');
    });
  });
});