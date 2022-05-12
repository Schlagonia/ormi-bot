# Ormi Liquidation Bot
* This bot will check for unhealthy loans using TheGraph
* Calculate profits
* Output details of unhealthy loan if its profitable to liquidate
* Execute liquidation of the loans

## Solidity Contract
* All contracts can be found in `/contracts`
* Can be deployed to Kovan for testing or MAINNET

# To get started
1. Install dependencies
`npm install`

2. Deploy contract
All contracts can be found in `/contracts`

# Starting the bot
1. Specify the chain to use via APP_CHAIN_ID

2. Execute liquidation script
`npm run build`
`npm start`


Thanks to this repo for providing a base to start with.
https://github.com/ialberquilla/aave-liquidation
