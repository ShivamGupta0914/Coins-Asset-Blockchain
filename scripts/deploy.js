const {ethers} = require('hardhat');

async function main() {
    const [deployer, user1, user2] = await ethers.getSigners();

    const coinsContract = await ethers.getContractFactory("Coins");
    console.log("Coins contract is deploying at address............" );
    const Coins = await coinsContract.deploy("Shiva Token", "SHIVA");
    await Coins.deployed();
    console.log("Coins contract is deployed at address : ", Coins.address);

    const assetContract = await ethers.getContractFactory("Assets");
    console.log("Assets contract is deploying at address............" );
    const Assets = await assetContract.deploy(Coins.address);
    await Assets.deployed();
    console.log("Coins contract is deployed at address : ", Assets.address);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  