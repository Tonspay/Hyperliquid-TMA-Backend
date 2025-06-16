const db = require("../../utils/db")
const config = require("../../config");
const web3 = require("../../utils/web3");
const { sleep } = require("../../utils/tools");
const ff = require("../../utils/ff")
const tools = require("../../utils/tools")
require('dotenv').config();

const checkOrder = async(oid) =>
{
    const o = await db.getOrder(
        {
            oid,
        }
    );
    console.log(o);
    return (o.status === "DONE")?true:false;
}


async function newOrder(address,amount,res) {
    //1.Generate Bridge to arb via ff 
    const b = new ff(
        {
            keys: tools.getFFKeys(),
        }
    );
    const tx = await b.bridge(
        {
            from:"TON",
            to:"USDCARBITRUM",
            amount:amount,
            toAddress:process.env.LISTEN_EVM,
        }
    )
    console.log(tx)
    if(tx && tx?.data)
    {
        let _tx = JSON.parse(JSON.stringify(tx.data));
        _tx['address']=address;
        _tx['amount']=amount;
        _tx["action"]="bridge"
        _tx['create_time']=Date.now();
        _tx['oid']=address+"_"+Date.now();
        console.log("The tx ::",_tx);
        
        await db.updateOrder(
            _tx
        )

        //2. Print the transaction information and qr to user 
        const to = tx.data.from.address;
        amount = tx.data.from.amount
        
        await res.status(200).send({
            "code": 200,
            "data": _tx
        })

        let _final = await b.bridge_confirm();
        if(_final)
        {
            console.log("Final Payment ::",JSON.stringify(_final))
            let _finalTx = JSON.parse(JSON.stringify(_final));
            _finalTx['address']=address;
            _finalTx['amount']=amount;
            _finalTx["action"]="bridge"
            _finalTx["create_time"] = _tx['create_time']
            _finalTx["oid"] = _tx['oid']
            console.log("The _finalTx ::",_finalTx);
            
            await db.updateOrder(
                _finalTx
            )
            //3. Payment success . Deposite USDC to Hyperliquid , and wait for confirm , and Hyperliquid to user .
            //Conver it as deposite txn
            let finalAmount = Number(_final.to.amount)
            try{
                //Now try send txn
                const onchainTx = await web3.depositeToHyperliquid((finalAmount*1e6).toFixed(0))
                if(onchainTx)
                {
                    //Onchain TX send success 
                    await sleep(15000) // Sleep for 15s for Hyperliquid confirm the txn
                    const confirmTransfer = await web3.transferHyperliquidUSDCVaultToAccount((finalAmount).toFixed(2) , address)
                    if(confirmTransfer)
                    {
                        return true;
                    }
                }else{
                    return false;
                }
            }catch(e)
            {
                console.error(e)
                return false
            }
        }else{
            return false
        }
    }else{
        console.error(tx)   
    }
//Failed
return false;
}
module.exports = {
    checkOrder,
    newOrder
}