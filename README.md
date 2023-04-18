# Sample Hardhat Project

### This is a project that demonstrates how ERC20 Tokens can be exchanges with Non-Fungible-Token i.e. ERC721
#### User having sufficient ERC20 tokens(coins) can get ERC721 token in exchange

Run project by following the steps below:

```shell
npx hardhat compile
```
To run test cases use command:
```shell
npx hardhat test
```
To deploy on hardhat local network use command:
```shell
npx hardhat run scripts/deploy.js
```
To deploy on testnet or mainnet use command:
```shell
npx hardhat run scripts/deploy.js --network <network name>
```
To deploy on network remember to save network url, api key, private key in .env file that will be exported in hardhat-config file.