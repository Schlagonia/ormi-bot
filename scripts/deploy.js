
const { ethers } = require("hardhat");
const hre = require("hardhat");
const { networks } = require('../hardhat.config')

//must create a .env file with the variable PRIVATE_KEY. Usage: process.env.PRIVATE_KEY
require('dotenv').config()


async function main() {

  const currentNetwork = networks.kovan.url
  console.log("Deploying to current network: ", currentNetwork)

  console.log("Deploying Liquidator...")

  const Liquidator = await ethers.getContractFactory('LiquidateLoan')
  const liquidator = await Liquidator.deploy(
    '0x88757f2f99175387aB4C6a4b3067c77A695b0349', //address provider
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' //Uni v2 router
  )
  await liquidator.deployed()

  console.log("Liquidator Deployed to: ", liquidator.address)

  console.log("liquidator Ready to Go")

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
