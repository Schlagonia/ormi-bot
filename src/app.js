const { fetchV2UnhealthyLoans } = require('./v2liquidation.js');
const { getGasPrice } = require('./utils/gas')

//import { getGasPrice } from './utils/gas'
//import { fetchV2UnhealthyLoans } from './v2liquidation';

delayedFetchUnhealthyLoans();

//infinite loop calling fetchUnhealthyLoans
//sleep for 1 minute before each call
async function delayedFetchUnhealthyLoans(){
  
  //fetchV2UnhealthyLoans("0xfe206f90c58feb8e42474c5074de43c22da8bc35");
  while(1==1){
    //console.log(`gas cost ${gas_cost}`)
    console.log("fetching loans")
  
    //await getGasPrice();
    fetchV2UnhealthyLoans();
    await sleep(60000);
  }
  
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
