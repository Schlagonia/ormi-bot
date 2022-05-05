const { liquidateALoan } = require("./liquidation/liquidateLoan.js");
const { TOKEN_LIST } = require('./constants/index.js');
const { ChainId, Token, TokenAmount } = require('@uniswap/sdk')
const { useTradeExactIn } = require('./uniswap/trades.js');
const { gas_cost } = require('./utils/gas.js')
const fetch = require("node-fetch");
const GAS_USED_ESTIMATE = 1000000
const FLASH_LOAN_FEE = 0.009


const theGraphURL_v2_kovan = 'https://api.thegraph.com/subgraphs/name/schlagonia/ormi-finance'
const theGraphAave ='https://api.thegraph.com/subgraphs/name/aave/protocol-v2-kovan'
//const theGraphURL_v2_mainnet = 'https://api.thegraph.com/subgraphs/name/aave/protocol-v2'
const theGraphURL_v2 = theGraphAave //APP_CHAIN_ID == ChainId.MAINNET ? theGraphURL_v2_mainnet : theGraphURL_v2_kovan
const allowedLiquidation = .5 //50% of a borrowed asset can be liquidated
const healthFactorMax = 1 //liquidation can happen when less than 1
const profit_threshold = .1 * (10**16) //in eth. A bonus below this will be ignored

const fetchV2UnhealthyLoans = async function fetchV2UnhealthyLoans(user_id){
  var count = 1;
  var maxCount = 6;
  var user_id_query = "";

  if (user_id) {
    user_id_query = `id: "${user_id}",`;
    maxCount = 1;
  }
  console.log(`${Date().toLocaleString()} fetching unhealthy loans}`);
  while (count < maxCount) {
    fetch(theGraphURL_v2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
      query GET_LOANS {
        users(first:10, skip:${10 * count}, orderBy: id, orderDirection: desc, where: {${user_id_query}borrowedReservesCount_gt: 0}) {
          id
          borrowedReservesCount
          collateralReserve:reserves(where: {currentATokenBalance_gt: 0}) {
            currentATokenBalance
            reserve{
              usageAsCollateralEnabled
              reserveLiquidationThreshold
              reserveLiquidationBonus
              borrowingEnabled
              utilizationRate
              symbol
              underlyingAsset
              price {
                priceInEth
              }
              decimals
            }
          }
          borrowReserve: reserves(where: {currentTotalDebt_gt: 0}) {
            currentTotalDebt
            reserve{
              usageAsCollateralEnabled
              reserveLiquidationThreshold
              borrowingEnabled
              utilizationRate
              symbol
              underlyingAsset
              price {
                priceInEth
              }
              decimals
            }
          }
        }
      }`
      }),
    })
      .then(res => res.json())
      .then(res => {
        const total_loans = res.data.users.length;
        if(total_loans.length = 0) return;
        const unhealthyLoans = parseUsers(res.data);
        if (unhealthyLoans.length > 0)
          liquidationProfits(unhealthyLoans);
        if (total_loans > 0)
          console.log(`Records:${total_loans} Unhealthy:${unhealthyLoans.length}`);
      });
    count++;
  }
}

function parseUsers(payload) {
  var loans=[];
  payload.users.forEach((user, i) => {
    var totalBorrowed=0;
    var totalCollateral=0;
    var totalCollateralThreshold=0;
    var max_borrowedSymbol;
    var max_borrowedPrincipal=0;
    var max_borrowedPriceInEth = 0;
    var max_collateralSymbol;
    var max_collateralBonus=0;
    var max_collateralPriceInEth = 0;

    user.borrowReserve.forEach((borrowReserve, i) => {
      var priceInEth= borrowReserve.reserve.price.priceInEth
      var principalBorrowed = borrowReserve.currentTotalDebt
      totalBorrowed += priceInEth * principalBorrowed / (10**borrowReserve.reserve.decimals)
      if (principalBorrowed> max_borrowedPrincipal)
        max_borrowedSymbol = borrowReserve.reserve.symbol
        max_borrowedPrincipal = principalBorrowed
        max_borrowedPriceInEth = priceInEth
    });
    user.collateralReserve.forEach((collateralReserve, i) => {
      var priceInEth= collateralReserve.reserve.price.priceInEth
      var principalATokenBalance = collateralReserve.currentATokenBalance
      totalCollateral += priceInEth * principalATokenBalance / (10**collateralReserve.reserve.decimals)
      totalCollateralThreshold += priceInEth * principalATokenBalance * (collateralReserve.reserve.reserveLiquidationThreshold/10000)/ (10**collateralReserve.reserve.decimals)
      if (collateralReserve.reserve.reserveLiquidationBonus > max_collateralBonus){
        max_collateralSymbol = collateralReserve.reserve.symbol
        max_collateralBonus=collateralReserve.reserve.reserveLiquidationBonus
        max_collateralPriceInEth = priceInEth
      }
    });
    var healthFactor= totalCollateralThreshold / totalBorrowed;

    if (healthFactor<=healthFactorMax) {
      console.log("Found Unhealthy loan for user: ", user.id)
      loans.push( {
          "user_id"  :  user.id,
          "healthFactor"   :  healthFactor,
          "max_collateralSymbol" : max_collateralSymbol,
          "max_borrowedSymbol" : max_borrowedSymbol,
          "max_borrowedPrincipal" : max_borrowedPrincipal,
          "max_borrowedPriceInEth" : max_borrowedPriceInEth,
          "max_collateralBonus" : max_collateralBonus/10000,
          "max_collateralPriceInEth" : max_collateralPriceInEth
        })
    } else {
      console.log("User: ", user.id, " has a healthy loan")
    }
  });

  //filter out loans under a threshold that we know will not be profitable (liquidation_threshold)
  loans = loans.filter(loan => loan.max_borrowedPrincipal * allowedLiquidation * (loan.max_collateralBonus-1) * loan.max_borrowedPriceInEth / 10 ** TOKEN_LIST[loan.max_borrowedSymbol].decimals >= profit_threshold)
  return loans;
}
async function liquidationProfits(loans){
  loans.map(async (loan) => {
     liquidationProfit(loan)
     })
}

async function liquidationProfit(loan){
  //flash loan fee
  const flashLoanAmount = percentBigInt(BigInt(loan.max_borrowedPrincipal), allowedLiquidation)
  const flashLoanCost = percentBigInt(flashLoanAmount, FLASH_LOAN_FEE)

  //minimum amount of liquidated coins that will be paid out as profit
  var flashLoanAmountInEth = flashLoanAmount * BigInt(loan.max_borrowedPriceInEth) / BigInt(10 ** TOKEN_LIST[loan.max_borrowedSymbol].decimals)
  var flashLoanAmountInEth_plusBonus = percentBigInt(flashLoanAmountInEth,loan.max_collateralBonus) //add the bonus
  var collateralTokensFromPayout  = flashLoanAmountInEth_plusBonus * BigInt(10 ** TOKEN_LIST[loan.max_collateralSymbol].decimals) / BigInt(loan.max_collateralPriceInEth) //this is the amount of tokens that will be received as payment for liquidation and then will need to be swapped back to token of the flashloan
  var fromTokenAmount = new TokenAmount(TOKEN_LIST[loan.max_collateralSymbol], collateralTokensFromPayout)// this is the number of coins to trade (should have many 0's)
  var bestTrade = await useTradeExactIn(fromTokenAmount, TOKEN_LIST[loan.max_collateralSymbol], TOKEN_LIST[loan.max_borrowedSymbol])

  var minimumTokensAfterSwap = bestTrade ? (BigInt(bestTrade.outputAmount.numerator) * BigInt(10 ** TOKEN_LIST[loan.max_borrowedSymbol].decimals)) / BigInt(bestTrade.outputAmount.denominator) : BigInt(0)

  //total profits (bonus_after_swap - flashLoanCost).to_eth - gasFee
  var gasFee = gasCostToLiquidate() //calc gas fee
  var flashLoanPlusCost = (flashLoanCost + flashLoanAmount)
  var profitInBorrowCurrency = minimumTokensAfterSwap - flashLoanPlusCost
  var profitInEth = profitInBorrowCurrency * BigInt(loan.max_borrowedPriceInEth) / BigInt(10 ** TOKEN_LIST[loan.max_borrowedSymbol].decimals)
  var profitInEthAfterGas = (profitInEth)  - gasFee

  console.log("Profit in ETH: ", profitInEth)
  console.log("Profit in ETH after gas: ", profitInEthAfterGas)
  
    console.log("-------------------------------")
    console.log(`user_ID:${loan.user_id}`)
    console.log(`HealthFactor ${loan.healthFactor.toFixed(2)}`)
    console.log(`flashLoanAmount ${flashLoanAmount} ${loan.max_borrowedSymbol}`)
    console.log(`flashLoanAmount converted to eth ${flashLoanAmountInEth}`)
    console.log(`flashLoanAmount converted to eth plus bonus ${flashLoanAmountInEth_plusBonus}`)
    console.log(`payout in collateral Tokens ${collateralTokensFromPayout} ${loan.max_collateralSymbol}`)
    console.log(`${loan.max_borrowedSymbol} received from swap ${minimumTokensAfterSwap} ${loan.max_borrowedSymbol}`)
    bestTrade ? showPath(bestTrade) : console.log("no path")
    console.log(`flashLoanPlusCost ${flashLoanPlusCost}`)
    console.log(`gasFee ${gasFee}`)
    console.log(`profitInEthAfterGas ${Number(profitInEthAfterGas)/(10 ** 18)}eth`)
  if (profitInEthAfterGas>0)
  {
    await liquidateALoan(loan, flashLoanAmount, minimumTokensAfterSwap, showPath(bestTrade))
  }
    //console.log(`user_ID:${loan.user_id} HealthFactor ${loan.healthFactor.toFixed(2)} allowedLiquidation ${flashLoanAmount.toFixed(2)} ${loan.max_collateralSymbol}->${loan.max_borrowedSymbol}` )
    //console.log(`minimumTokensAfterSwap ${minimumTokensAfterSwap} flashLoanCost ${flashLoanCost} gasFee ${gasFee} profit ${profit.toFixed(2)}`)

}
//returned value is in eth
function gasCostToLiquidate(){
  return BigInt(gas_cost * GAS_USED_ESTIMATE)
}
// percent is represented as a number less than 0 ie .75 is equivalent to 75%
// multiply base and percent and return a BigInt
function percentBigInt(base,percent) {
  return BigInt(BigInt(base) * BigInt(percent * 10000) / BigInt(10000))
}
function showPath(trade){
  var pathSymbol=""
  var pathAddress= []
  trade.route.path.map(async (token) => {
     pathSymbol+=token.symbol+"->"
     pathAddress.push(token.address)
     })
  pathSymbol=pathSymbol.slice(0,-2)
  console.log(`${pathSymbol} ${JSON.stringify(pathAddress)}`)
  return [pathSymbol,pathAddress]
}

module.exports = { fetchV2UnhealthyLoans, profit_threshold}