const { ChainId, Currency, CurrencyAmount, ETHER, Token, TokenAmount, WETH } = require('@uniswap/sdk')

function wrappedCurrency(token, chainId) {
  return chainId && token === ETHER ? WETH[chainId] : token
}

function wrappedCurrencyAmount(tokenAmount){

  const token = tokenAmount && tokenAmount.chainId ? wrappedCurrency(tokenAmount.token, tokenAmount.chainId) : undefined
  return token && tokenAmount ? new TokenAmount(token, tokenAmount.raw) : undefined
}

function unwrappedToken(token) {
  if (token.equals(WETH[token.chainId])) return ETHER
  return token
}

module.exports = { unwrappedToken, wrappedCurrencyAmount, wrappedCurrency }
