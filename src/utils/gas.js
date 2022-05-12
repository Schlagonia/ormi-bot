
const fetch = require("node-fetch");
const { signer, provider } = require('../globals.js')

let GAS_PRICE = 0;
//returns gas for rapid time (within 15s)
//https://www.gasnow.org/

const getGasPrice = async function(){
  let gasPrice = await provider.getGasPrice()

  return gasPrice
}

module.exports = { GAS_PRICE, getGasPrice }
