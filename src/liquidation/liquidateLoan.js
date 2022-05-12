
const { ethers } = require("hardhat");
const hre = require("hardhat");
const { networks } = require('../../hardhat.config')
const { signer, provider } = require('../globals.js')
const { abi } = require('../../abi/Liquidator.js')
const { LiquidateLoan } = require('../../artifacts/contracts/LiquidateLoan.sol/LiquidateLoan')
const { aaveLiquidatorAddress, ormiLiquidatorAddress, TOKEN_LIST } = require('../constants/index.js')
require('dotenv').config();

const liquidateALoan = async function liquidateAloan(loan, flashLoanAmount, minimumTokensAfterSwap, showPath) {
    
    console.log("Liquidating loan for user: ", loan.user_id)

    //let global = setGlobals()

    //let wallet = new ethers.Wallet(process.env.privateKey, provider);
    
    let liquidator = new ethers.Contract(
        ormiLiquidatorAddress,
        abi,
        signer
    )

    /*
    let gasLimit = await liquidator.estimateGas.executeFlashLoans(
        TOKEN_LIST[loan.max_borrowedSymbol].address, // _assetToLiquidate - the token address of the asset that will be liquidated
        flashLoanAmount, //_flashAmt - flash loan amount (number of tokens) which is exactly the amount that will be liquidated
        TOKEN_LIST[loan.max_collateralSymbol].address, // _collateral - the token address of the collateral. This is the token that will be received after liquidating loans
        loan.user_id, // _userToLiquidate - user ID of the loan that will be liquidated
        minimumTokensAfterSwap, // _amountOutMin - when using uniswap this is used to make sure the swap returns a minimum number of tokens, or will revert
        showPath[1] // _swapPath - the path that uniswap will use to swap tokens back to original tokens
    )
    console.log('Gas Limit ', gasLimit)
    */
    let gasPrice = await provider.getGasPrice()

    let options = {
        gasLimit: '1000000',
        gasPrice
    }

    let tx = await liquidator.connect(signer).executeFlashLoans(
        TOKEN_LIST[loan.max_borrowedSymbol].address, // _assetToLiquidate - the token address of the asset that will be liquidated
        flashLoanAmount, //_flashAmt - flash loan amount (number of tokens) which is exactly the amount that will be liquidated
        TOKEN_LIST[loan.max_collateralSymbol].address, // _collateral - the token address of the collateral. This is the token that will be received after liquidating loans
        loan.user_id, // _userToLiquidate - user ID of the loan that will be liquidated
        minimumTokensAfterSwap, // _amountOutMin - when using uniswap this is used to make sure the swap returns a minimum number of tokens, or will revert
        showPath[1], // _swapPath - the path that uniswap will use to swap tokens back to original tokens
        options
    )

    console.log("Loan Liquidation sent...")
    await tx.wait();

    console.log("Loan succesfully liquidated: ", tx)

}

module.exports = { liquidateALoan }