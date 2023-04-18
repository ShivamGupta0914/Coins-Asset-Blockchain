const hre = require("hardhat");
const fs = require('fs');

async function exchangeProcess() {
    const [deployer, user1, user2] = await hre.ethers.getSigners();
    // these are the addresses of deployed contracts on sepolia. 
    const CoinsAddress = "0xc21AD4b11aC984162aF5218D4Ea6D2A3B06E4089";
    const AssetAddress = "0x7e17a40DA072fcB009dFcAf427172B3427a77827";
    let dataAbiCoins = fs.readFileSync("/home/qodeleaf/blockchain/Day-7(Assets-Coins)/artifacts/contracts/ERC20.sol/Coins.json", "UTF-8");
    dataAbiCoins = JSON.parse(dataAbiCoins);
    dataAbiCoins = dataAbiCoins["abi"];

    let dataAbiAsset = fs.readFileSync("/home/qodeleaf/blockchain/Day-7(Assets-Coins)/artifacts/contracts/ERC721.sol/Assets.json", "UTF-8");
    dataAbiAsset = JSON.parse(dataAbiAsset);
    dataAbiAsset = dataAbiAsset["abi"];

    const Coins = await ethers.getContractAt(dataAbiCoins, CoinsAddress);
    const Asset = await ethers.getContractAt(dataAbiAsset, AssetAddress);

    console.log(await Coins.balanceOf(deployer.address));
    await Asset.connect(user1).mintNFT();

    await Asset.connect(user1).setPrice(2, BigInt(100000000000000000000));
    console.log("new owner of asset id 2 is ..." + await Asset.ownerOf(2));

    console.log("approving Asset contract for sending ERC20 token");
    await Coins.approve(Asset.address, BigInt(100000000000000000000));
    console.log("contract approved");

    await Asset.connect(deployer).exchangeCoins(2, {gasLimit : 1000000});

    console.log("new owner of asset id 2 is ..." + await Asset.ownerOf(2));
    console.log("new balance of user1 is...." + await Coins.balanceOf(user1.address));

}

exchangeProcess();