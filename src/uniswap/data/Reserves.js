const { ChainId, TokenAmount, Pair, Currency, Fetcher } = require( '@uniswap/sdk')
const { wrappedCurrency } = require( '../utils/wrappedCurrency.js')
var providers = require('ethers').providers;
/*
export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}
*/
const usePairs = async function usePairs(currencies, chainId ) {

//convert to to wrapped tokens where needed
  const tokens =
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId)
      ])
//convert to pairs and get their reserves
  const reserves = await getReserves(tokens)
  //filter out nulls
  const reserves_cleansed = reserves.filter(result => !!result )
  //console.log(`results ${JSON.stringify(reserves,null,2)}`)
  return reserves_cleansed
}

const usePair = async function usePair(tokenA, tokenB) {
  return usePairs([[tokenA, tokenB]])[0]
}

async function getReserves(tokens){
  const results = await Promise.all(tokens.map(async([tokenA, tokenB]) => {
    if (tokenA && tokenB && tokenA.equals(tokenB)){
      return
    }
    //console.log (`tokenA ${tokenA.symbol} tokenB ${tokenB.symbol}`)
    try {
      const pairDetails = await Fetcher.fetchPairData(tokenA, tokenB)
      return pairDetails
    }
    catch(e){
      }
    }
  )
)
  return results
}

module.exports = { usePair, usePairs, }
