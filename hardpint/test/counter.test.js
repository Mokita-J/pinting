const { expect } = require('chai');
const path = require('path');
const { deployContract, queryState, submitSolution } = require('./helpers');

describe('Counter Contract', () => {
  const sourcePath = path.join(__dirname, '../contracts');
  const contractName = 'counter';

  it('should deploy successfully', async () => {
    const contractInfo = await deployContract(contractName, sourcePath);
    expect(contractInfo.contractAddress).to.be.equal('1899743AA94972DDD137D039C2E670ADA63969ABF93191FA1A4506304D4033A2');
    expect(contractInfo.methodAddress).to.be.equal('355A12DCB600C302FFD5D69C4B7B79E60BA3C72DDA553B7D43F4C36CB7CC0948');
    expect(contractInfo.address).to.be.equal('1FD5247B6DBB3C79CA875FD54894F71F0840F38E469D5A2270BD8AE02FBF22FA');

    const state = await queryState(contractInfo.contractAddress, "0000000000000000");
    expect(state).to.be.equal('null');

    const mutations = [{key: [0], value: [1]}];

    const solution = await submitSolution(contractInfo.contractAddress, contractInfo.methodAddress, [], mutations);
    expect(solution).to.be.equal("68A1BC8E7A5E6789E8DE4BC59A7ADD0BFC5AF7FA591FCC03CEBE6E4754C13CA1");
    // wait for the state to be updated
    await new Promise(resolve => setTimeout(resolve, 1000));
    const postState = await queryState(contractInfo.contractAddress, "0000000000000000");
    expect(postState).to.be.equal('[1]');
  });
});