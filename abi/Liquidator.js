
    abi = [
    {
        "inputs": [
            {
                "internalType": "contract ILendingPoolAddressesProvider",
                "name": "_addressProvider",
                "type": "address"
            },
            {
                "internalType": "contract IUniswapV2Router02",
                "name": "_uniswapV2Router",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "string",
                "name": "stringFailure",
                "type": "string"
            }
        ],
        "name": "ErrorHandled",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_assetToLiquidate",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_flashAmt",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_collateral",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_userToLiquidate",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_amountOutMin",
                "type": "uint256"
            },
            {
                "internalType": "address[]",
                "name": "_swapPath",
                "type": "address[]"
            }
        ],
        "name": "executeFlashLoans",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "assets",
                "type": "address[]"
            },
            {
                "internalType": "uint256[]",
                "name": "amounts",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "premiums",
                "type": "uint256[]"
            },
            {
                "internalType": "address",
                "name": "initiator",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "params",
                "type": "bytes"
            }
        ],
        "name": "executeOperation",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "isOwner",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_collateral",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_liquidate_asset",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_userToLiquidate",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "_receiveaToken",
                "type": "bool"
            }
        ],
        "name": "liquidateLoan",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "asset_from",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amountOutMin",
                "type": "uint256"
            },
            {
                "internalType": "address[]",
                "name": "swapPath",
                "type": "address[]"
            }
        ],
        "name": "swapToBorrowedAsset",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
]

module.exports = {abi}

