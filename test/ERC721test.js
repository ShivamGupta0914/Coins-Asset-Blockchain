const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");
const { user } = require("pg/lib/defaults");

describe("Token contract", function () {
    const zero_address = "0x0000000000000000000000000000000000000000";
    async function deployFixture() {
        const [deployer, user1, user2] = await ethers.getSigners();
        const coinsContract = await ethers.getContractFactory("Coins");
        const Coins = await coinsContract.deploy("Shiva Token", "SHIVA");
        await Coins.deployed();
        const assetContract = await ethers.getContractFactory("Assets");
        const Assets = await assetContract.deploy(Coins.address);
        await Assets.deployed();

        const bContract = await ethers.getContractFactory("B");
        const B = await bContract.deploy();
        await B.deployed();
        const cContract = await ethers.getContractFactory("C");
        const C = await cContract.deploy();
        await C.deployed();
        return { Assets, Coins, B, C, deployer, user1, user2 };
    }

    it("mint function should work properly", async function () {
        const { Assets, deployer} = await loadFixture(deployFixture);
        const NFTCount = await Assets.totalNFTs();
        expect(await Assets.mintNFT()).to.emit(Assets, "Transfer").withArgs(zero_address, deployer.address, NFTCount);
    });

    it("should return address of the token owner", async function () {
        const { Assets, deployer } = await loadFixture(deployFixture);
        await Assets.mintNFT();
        expect(await Assets.ownerOf(0)).to.equal(deployer.address);
    });

    it("should return balance of owner", async () => {
        const { Assets, deployer } = await loadFixture(deployFixture);
        expect(await Assets.balanceOf(deployer.address)).to.equal(0);
        await Assets.mintNFT();
        expect(await Assets.balanceOf(deployer.address)).to.equal(1);
    });

    it("should approve correctly", async () => {
        const { Assets, deployer, user1 } = await loadFixture(deployFixture);
        await Assets.mintNFT();
        await expect(Assets.approve(user1.address, 0)).to.emit(Assets, "Approval").withArgs(deployer.address, user1.address, 0);
        expect(await Assets.getApproved(0)).to.equal(user1.address);
        await expect(Assets.approve(user1.address, 2)).to.be.revertedWith("owner does not own this token");
        await expect(Assets.approve(zero_address, 2)).to.be.revertedWith("can not approve zero address");
    });

    it("transferFrom function should work correctly", async function () {
        const { Assets, deployer, user1, user2 } = await loadFixture(deployFixture);
        await Assets.mintNFT();
        expect(await Assets.transferFrom(deployer.address, user1.address, 0)).to.emit(Assets, "Transfer").withArgs(deployer.address, user1.address, 0);
        expect(await Assets.ownerOf(0)).to.equal(user1.address);
        await expect(Assets.transferFrom(deployer.address, user1.address, 0)).to.be.revertedWith("owner does not own this token");
        await Assets.connect(user1).approve(deployer.address, 0);
        await expect(Assets.transferFrom(user1.address, user2.address, 2)).to.be.revertedWith("owner does not own this token");
        await Assets.connect(user1).mintNFT();
        await expect(Assets.transferFrom(user1.address, user2.address, 1)).to.be.revertedWith("can not send token");
        expect(await Assets.getApproved(0)).to.equal(deployer.address);
        expect(await Assets.transferFrom(user1.address, user2.address, 0));
        expect(await Assets.ownerOf(0)).to.equal(user2.address);
        await Assets.connect(user2).setApprovalForAll(deployer.address, true);
        await Assets.transferFrom(user2.address, deployer.address, 0);
    });

    it("setApprovalForAll should work correctly", async function () {
        const { Assets, deployer, user1, user2 } = await loadFixture(deployFixture);
        expect(await Assets.setApprovalForAll(user1.address, true)).to.emit(Assets, "ApprovalForAll").withArgs(deployer.address, user1.address, false);
        expect(await Assets.isApprovedForAll(deployer.address, user1.address)).to.equal(true);
        expect(await Assets.isApprovedForAll(deployer.address, user2.address)).to.equal(false);
        await expect(Assets.setApprovalForAll(zero_address, true)).to.be.revertedWith("can not approve zero address");
    });

    it("isApprovedForAll should work properly", async function () {
        const { Assets, deployer, user1, user2 } = await loadFixture(deployFixture);
        expect(await Assets.setApprovalForAll(user1.address, true)).to.emit(Assets, "ApprovalForAll").withArgs(deployer.address, user1.address, false);
        expect(await Assets.isApprovedForAll(deployer.address, user1.address)).to.equal(true);
        expect(await Assets.isApprovedForAll(deployer.address, user2.address)).to.equal(false);
    });

    it("getApproved should work properly", async function () {
        const { Assets, deployer } = await loadFixture(deployFixture);
        expect(await Assets.getApproved(5)).to.equal(zero_address);
    });

    it("safeTransferFrom without data should work properly", async function () {
        const { Assets, B, C, deployer, user1, user2 } = await loadFixture(deployFixture);
        await Assets.mintNFT();
        await Assets.mintNFT();
        await expect(Assets.functions['safeTransferFrom(address,address,uint256)'](deployer.address, user1.address, 0)).to.be.revertedWith("_to is not a contract account");
        await expect(Assets.functions['safeTransferFrom(address,address,uint256)'](deployer.address, B.address, 0)).to.emit(Assets, "Transfer").withArgs(deployer.address, B.address, 0);
        await expect(Assets.functions['safeTransferFrom(address,address,uint256)'](deployer.address, C.address, 1)).to.be.revertedWith("_to contract does not implement ERC721Received");
    });

    it("safeTransferFrom with data should work properly", async function () {
        const { Assets, B, C, deployer, user1, user2 } = await loadFixture(deployFixture);
        await Assets.mintNFT();
        await Assets.mintNFT();
        await expect(Assets.functions['safeTransferFrom(address,address,uint256,bytes)'](deployer.address, user1.address, 0, "0x00")).to.be.revertedWith("_to is not a contract account");
        await expect(Assets.functions['safeTransferFrom(address,address,uint256,bytes)'](deployer.address, B.address, 0, "0x00")).to.emit(Assets, "Transfer").withArgs(deployer.address, B.address, 0);
        await expect(Assets.functions['safeTransferFrom(address,address,uint256,bytes)'](deployer.address, C.address, 1, "0x00")).to.be.revertedWith("_to contract does not implement ERC721Received");
    });

    it("should set price of the token", async function() {
        const { Assets } = await loadFixture(deployFixture);
        await Assets.mintNFT();
        await expect(Assets.setPrice(1, BigInt(100000000000000000000))).to.be.revertedWith("not authorized to set price");
        await Assets.mintNFT();
        await Assets.mintNFT();
        expect(await Assets.setPrice(2, BigInt(100000000000000000000)));
        expect(await Assets.prices(2)).to.equal(BigInt(100000000000000000000));
    });

    it("exchangeCoins function should work properly", async function() {
        const { Assets, deployer, user1, Coins } = await loadFixture(deployFixture);
        await Assets.mintNFT();
        await expect(Assets.exchangeCoins(0)).to.be.revertedWith("you already own this token");
        await Assets.connect(user1).mintNFT();
        await expect(Assets.exchangeCoins(1)).to.be.revertedWith("this asset is not for sell");
        expect(await Assets.connect(user1).setPrice(1, BigInt(100000000000000000000)));
        await Coins.approve(Assets.address,  BigInt(100000000000000000000));
        expect(await Assets.exchangeCoins(1));
        expect(await Assets.balanceOf(deployer.address)).to.equal(2);
    });
});