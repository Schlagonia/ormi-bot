const { isTradeBetter } = require('./utils/trades.js')
const { Pair, Trade } = require('@uniswap/sdk')
const flatMap = require('lodash.flatmap')

const { BASES_TO_CHECK_TRADES_AGAINST, CUSTOM_BASES, BETTER_TRADE_LESS_HOPS_THRESHOLD } = require('./constants/index.js')
const { usePairs } = require('./data/Reserves.js')
const { wrappedCurrency } = require('./utils/wrappedCurrency.js')

//const { useUnsupportedTokens } = require( './Tokens')

const useAllCommonPairs = async function useAllCommonPairs(token1, token2){
  const chainId = token1.chainId && token2.chainId  && token1.chainId == token2.chainId ? token1.chainId : null
  //console.log('Chain Id ', chainId)
  const bases = chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []
  //console.log("Bases ", bases)
  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(token1, chainId), wrappedCurrency(token2, chainId)]
    : [undefined, undefined]

  const basePairs =
      flatMap(bases, (base) => bases.map(otherBase => [base, otherBase])).filter(
        ([t0, t1]) => t0.address !== t1.address
      )
  //console.log("BasePairs: ", basePairs)
  const allPairCombinations =
    tokenA && tokenB
      ? [
          // the direct pair
          [tokenA, tokenB],
          // token A against all bases
          ...bases.map((base) => [tokenA, base]),
          // token B against all bases
          ...bases.map((base) => [tokenB, base]),
          // each base against all bases
          ...basePairs
        ]
          .filter((tokens) => Boolean(tokens[0] && tokens[1]))
          .filter(([t0, t1]) => t0.address !== t1.address)
          .filter(([tokenA, tokenB]) => {
            if (!chainId) return true
            const customBases = CUSTOM_BASES[chainId]
            if (!customBases) return true

            const customBasesA = customBases[tokenA.address]
            const customBasesB = customBases[tokenB.address]

            if (!customBasesA && !customBasesB) return true

            if (customBasesA && !customBasesA.find(base => tokenB.equals(base))) return false
            if (customBasesB && !customBasesB.find(base => tokenA.equals(base))) return false

            return true
          })
      : []
  //console.log("All Pair Cimbinations ", allPairCombinations)
  const allPairs = await usePairs(allPairCombinations, chainId)
  //console.log('All pairs ', allPairs)
  // only pass along valid pairs, non-duplicated pairs
  return Object.values(
      allPairs
        // filter out duplicated pairs
        .reduce((memo, curr) => {
          memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
          return memo
        }, {})
    )
}

const MAX_HOPS = 3

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
const useTradeExactIn = async function useTradeExactIn(tokenAmountIn, tokenIn, tokenOut) {
  const allowedPairs = await useAllCommonPairs(tokenIn, tokenOut)
  //console.log(`allowed pairs ${JSON.stringify(allowedPairs,null,2)}`)

  const singleHopOnly = false
  if (tokenAmountIn && tokenOut && allowedPairs.length > 0) {
    if (singleHopOnly) {
      return (
        Trade.bestTradeExactIn(allowedPairs, tokenAmountIn, tokenOut, { maxHops: 1, maxNumResults: 1 })[0] ??
        null
      )
    }
    // search through trades with varying hops, find best trade out of them
    let bestTradeSoFar;
    for (let i = 1; i <= MAX_HOPS; i++) {
      const currentTrade =
        Trade.bestTradeExactIn(allowedPairs, tokenAmountIn, tokenOut, { maxHops: i, maxNumResults: 1 })[0] ??
        null
      // if current trade is best yet, save it
      if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
        bestTradeSoFar = currentTrade
      }
    }
    //console.log(`bestTradeSoFar ${JSON.stringify(bestTradeSoFar,null,2)}`)
    //console.log(`inputAmount ${bestTradeSoFar.inputAmount.toSignificant(8)}`)
    //console.log(`outputAmount ${bestTradeSoFar.outputAmount.toSignificant(8)}`)
    //console.log(`executionPrice ${bestTradeSoFar.executionPrice.toSignificant(8)}`)
    return bestTradeSoFar
  }
  return null
}

function getTokenOutPath(_tokenIn, _tokenOut) {
  isBase = _tokenIn == 'WETH' || _tokenOut == 'WETH';
  _path = []
  _path[0] = _tokenIn;

  if (isBase) {
      _path[1] = _tokenOut;
  } else {
      _path[1] = 'WETH';
      _path[2] = _tokenOut;
  }
  
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
const useTradeExactOut = async function useTradeExactOut(tokenIn, tokenAmountOut) {
  const allowedPairs = useAllCommonPairs(tokenIn, tokenAmountOut.token)

  const singleHopOnly = false

    if (tokenIn && tokenAmountOut && (await allowedPairs).length > 0) {
      if (singleHopOnly) {
        return (
          Trade.bestTradeExactOut(await allowedPairs, tokenIn, tokenAmountOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          null
        )
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar;
      for (let i = 1; i <= MAX_HOPS; i++) {
        const currentTrade =
          Trade.bestTradeExactOut(await allowedPairs, tokenIn, tokenAmountOut, { maxHops: i, maxNumResults: 1 })[0] ??
          null
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
    }
    return null
}

module.exports = { useTradeExactOut, useTradeExactIn, useAllCommonPairs, getTokenOutPath };

//given a path, calculate swap price
//todo this function needs to be completed or deleted. Not currently funcioning right
/*
async function updateSwapPrices(){
  const pair = await Fetcher.fetchPairData(DAI_KOVAN, WETH[DAI_KOVAN.chainId])
  var DAI_WETH;
  const route = new Route([pair], WETH[DAI_KOVAN.chainId])
  DAI_WETH = route.midPrice.toSignificant(6)
  console.log(`${DAI_WETH} DAI per WETH`) // 201.306
  console.log(route.midPrice.invert().toSignificant(6)) // 0.00496756
}
*/
