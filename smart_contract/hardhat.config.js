require('dotenv').config()
require('@nomicfoundation/hardhat-toolbox')

const { PRIVATE_KEY, SEPOLIA_RPC_URL } = process.env

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    // MintProfileImage.sol ke hisaab se 0.8.0 safe rahega
    version: '0.8.2',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL || '',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
}
