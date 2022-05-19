const { ethers } = require("hardhat");
const { networks } = require('../hardhat.config')
const { ChainId, JSBI, Percent, Token } = require('@uniswap/sdk')

const APP_CHAIN_ID = ChainId.MAINNET

require('dotenv').config();

const setGlobals = () => {
    global.provider = new ethers.providers.JsonRpcProvider(networks.kovan.url)
    global.fromAccount = process.env.FROM_ACCOUNT
    global.privateKey = process.env.PRIVATE_KEY
    global.lpAddressProviderAddress = "0x1c8756FD2B28e9426CDBDcC7E3c4d64fa9A54728"

    return global;
}

const provider = new ethers.providers.JsonRpcProvider(networks.kovan.url)

const signer = new ethers.Wallet(process.env.PRIV_KEY, provider)

module.exports = { provider, signer }
