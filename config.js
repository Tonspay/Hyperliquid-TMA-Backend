const erc20ABI = require("./utils/abis/erc20.json")
const bridge = require("./utils/abis/bridge.json")
const cfg = {
    contract:{
        bridge:{
            address:"0x2df1c51e09aecf9cacb7bc98cb1742757f163df7",
            abi:bridge
        },
        tokens:{
            usdc:"0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            abi:erc20ABI
        }
    }
}
module.exports = {
    cfg
}