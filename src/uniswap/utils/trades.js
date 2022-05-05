const { ZERO_PERCENT, ONE_HUNDRED_PERCENT } = require('../constants/index.js')
const { Trade, Percent, currencyEquals } = require('@uniswap/sdk')

// returns whether tradeB is better than tradeA by at least a threshold percentage amount
function isTradeBetter(
  tradeA,
  tradeB,
  minimumDelta = ZERO_PERCENT
){
  if (tradeA && !tradeB) return false
  if (tradeB && !tradeA) return true
  if (!tradeA || !tradeB) return undefined

  if (
    tradeA.tradeType !== tradeB.tradeType ||
    !currencyEquals(tradeA.inputAmount.currency, tradeB.inputAmount.currency) ||
    !currencyEquals(tradeB.outputAmount.currency, tradeB.outputAmount.currency)
  ) {
    throw new Error('Trades are not comparable')
  }

  if (minimumDelta.equalTo(ZERO_PERCENT)) {
    return tradeA.executionPrice.lessThan(tradeB.executionPrice)
  } else {
    return tradeA.executionPrice.raw.multiply(minimumDelta.add(ONE_HUNDRED_PERCENT)).lessThan(tradeB.executionPrice)
  }
}

module.exports = {isTradeBetter}
