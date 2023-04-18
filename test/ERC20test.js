const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Token contract", function () {

    async function deployTokenFixture() {
        const Token = await ethers.getContractFactory("Coins");
        const [owner, addr1, addr2] = await ethers.getSigners();
        const hardhatToken = await Token.deploy("Shiva Token", "SHIVA");
        await hardhatToken.deployed();
        return { Token, hardhatToken, owner, addr1, addr2 };
    }

    const zero_address = "0x0000000000000000000000000000000000000000";
    it("Deployment should assign the total supply of tokens to the owner", async function () {
        const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
        const ownerBalance = await hardhatToken.balanceOf(owner.address);
        expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });

    it("should use transfer correctly", async function () {
        const { hardhatToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
        await hardhatToken.transfer(addr1.address, 100);
        expect(await hardhatToken.balanceOf(addr1.address)).to.equal(100);
        expect(await hardhatToken.transfer(addr1.address, 100)).to.emit(hardhatToken, "Transfer").withArgs(owner.address, addr1.address, 100);
        await expect(hardhatToken.connect(addr1).transfer(addr2.address, 10000)).to.be.revertedWith("Insufficient amount");
        await expect(hardhatToken.connect(addr1).transfer(zero_address, 10000)).to.be.revertedWith("can not send tokens to zero address");
    });

    it("should approve someone", async function () {
        const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
        await hardhatToken.approve(addr1.address, 100);
        expect(await hardhatToken.allowance(owner.address, addr1.address)).to.equal(100);
        expect(await hardhatToken.approve(addr1.address, 100)).to.emit(hardhatToken, "Approval").withArgs(owner.address, addr1.address, 100);
        await expect(hardhatToken.approve(owner.address, 100)).to.be.revertedWith("Can not approve Yourself");

    });

    it("should use transferFrom correctly", async function () {
        const { hardhatToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
        await hardhatToken.approve(addr1.address, 1000);
        await hardhatToken.connect(addr1).transferFrom(owner.address, addr2.address, 100);
        expect(await hardhatToken.balanceOf(addr2.address)).to.equal(100);
        expect(await hardhatToken.connect(addr1).transferFrom(owner.address, addr2.address, 100)).to.emit(hardhatToken, "Transfer").withArgs(owner.address, addr2.address, 100);
        await expect(hardhatToken.connect(addr1).transferFrom(owner.address, owner.address, 100)).to.be.revertedWith("same from and to");
        await expect(hardhatToken.connect(addr1).transferFrom(owner.address, addr1.address, BigInt(Math.pow(10, 24)))).to.be.revertedWith("from does not have sufficient balance");
        await expect(hardhatToken.connect(addr1).transferFrom(owner.address, addr1.address, BigInt(Math.pow(10, 20)))).to.be.revertedWith("Not Authorized Or Insufficient Balance");
        await expect(hardhatToken.connect(addr1).transferFrom(zero_address, addr1.address, BigInt(Math.pow(10, 20)))).to.be.revertedWith("can not transfer or send to zero address");
        await expect(hardhatToken.connect(addr1).transferFrom(owner.address, zero_address, BigInt(Math.pow(10, 20)))).to.be.revertedWith("can not transfer or send to zero address");


    });

    it("should mint token correctly", async function () {
        const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
        await hardhatToken.mint(addr1.address, 100);
        expect(BigInt(await hardhatToken.totalSupply())).to.equal(BigInt(Math.pow(10, 21)) + BigInt(100));
        expect(await hardhatToken.mint(addr1.address, 100)).to.emit(hardhatToken, "Transfer").withArgs(0, addr1.address, 100);
        await expect(hardhatToken.connect(addr1).mint(owner.address, 100)).to.be.revertedWith("not authorized to mint");
        await expect(hardhatToken.mint(zero_address, 100)).to.be.revertedWith("Cannot mint tokens to the zero address");
    });

    it("should burn token correctly", async function () {
        const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
        await hardhatToken.transfer(addr1.address, 1000);
        await hardhatToken.burn(addr1.address, 100);
        const expectedTotalSupply = BigInt(Math.pow(10, 21)) - BigInt(100);
        expect(BigInt(await hardhatToken.totalSupply())).to.equal(expectedTotalSupply);
        expect(await hardhatToken.burn(addr1.address, 100)).to.emit(hardhatToken, "Transfer").withArgs(addr1.address, 0, 100);
        await expect(hardhatToken.connect(addr1).burn(addr1.address, 100)).to.be.revertedWith("not authorized to burn");
        await expect(hardhatToken.burn(addr1.address, 10000)).to.be.revertedWith("Not enough balance");
    });

    it("burnFrom should work correctly", async function () {
        const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
        await hardhatToken.approve(addr1.address, 1000);
        await hardhatToken.connect(addr1).burnFrom(owner.address, 100);
        const expectedTotalSupply = BigInt(Math.pow(10, 21)) - BigInt(100);
        expect(BigInt(await hardhatToken.totalSupply())).to.equal(expectedTotalSupply);
        expect(await hardhatToken.connect(addr1).burnFrom(owner.address, 100)).to.emit(hardhatToken, "Transfer").withArgs(owner.address, 0, 100);
        await expect(hardhatToken.connect(addr1).burnFrom(owner.address, 1000)).to.be.revertedWith("you are not approved or Low Approval Balance");
        await expect(hardhatToken.connect(addr1).burnFrom(zero_address, 10)).to.be.revertedWith("can not burn from zero address");
        await hardhatToken.approve(addr1.address, BigInt(Math.pow(10,24)));
        await expect(hardhatToken.connect(addr1).burnFrom(owner.address, BigInt(Math.pow(10,24)))).to.be.revertedWith("Insufficient funds in from account");
    });

    it("should return total supply of token", async function () {
        const { hardhatToken } = await loadFixture(deployTokenFixture);
        expect(await hardhatToken.totalSupply()).to.equal(BigInt(1000 * Math.pow(10, 18)));
    });

    it("should return balance of the account", async function () {
        const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
        expect(await hardhatToken.balanceOf(owner.address) / Math.pow(10, 18)).to.equal(1000);
    })

    it("should return name of the token", async function () {
        const { hardhatToken } = await loadFixture(deployTokenFixture);
        expect(await hardhatToken.name()).to.equal("Shiva Token");
    });

    it("should return symbol of the token", async function () {
        const { hardhatToken } = await loadFixture(deployTokenFixture);
        expect(await hardhatToken.symbol()).to.equal("SHIVA");
    });

    it("should return allowance correctly", async function () {
        const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
        await hardhatToken.approve(addr1.address, 100);
        expect(await hardhatToken.allowance(owner.address, addr1.address)).to.equal(100);
    });
});