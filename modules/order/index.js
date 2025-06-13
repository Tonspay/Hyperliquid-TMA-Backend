const db = require("../../utils/db")
const config = require("../../config");
const web3 = require("../../utils/web3");
const { sleep } = require("../../utils/tools");
require('dotenv').config();

const checkOrder = async(uid,id) =>
{
    const o = await db.getOrder(
        {
            uid,
            create_time:Number(id)
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
            to:"USDCARB",
            amount:amount,
            toAddress:process.env.LISTEN_EVM,
        }
    )
    if(tx)
    {
        let _tx = JSON.parse(JSON.stringify(tx.data));
        _tx['address']=address;
        _tx['amount']=amount;
        _tx["action"]="bridge"
        _tx['create_time']=Date.now();
        console.log("The tx ::",_tx);
        
        await db.updateOrder(
            _tx
        )

        //2. Print the transaction information and qr to user 
        const to = tx.data.from.address;
        amount = tx.data.from.amount
        
        await res.status(200).send({
            "code": 200,
            "data": {
                to,
                amount,
                orderId:_tx['create_time']
            }
        })

        let _final = await b.bridge_confirm();
        if(_final)
        {
            console.log("Final Payment ::",JSON.stringify(_final))
            let _finalTx = JSON.parse(JSON.stringify(_final));
            __finalTx['address']=address;
            _finalTx['amount']=amount;
            _finalTx["action"]="bridge"
            _finalTx["create_time"] = _tx['create_time']
            console.log("The _finalTx ::",_finalTx);
            
            await db.updateOrder(
                _finalTx
            )
            //3. Payment success . Deposite USDC to Hyperliquid , and wait for confirm , and Hyperliquid to user .
            //Conver it as deposite txn
            let finalAmount = Number(_final.to.amount)
            try{
                //Now try send txn
                const onchainTx = await web3.depositeToHyperliquid(finalAmount)
                if(onchainTx)
                {
                    //Onchain TX send success 
                    await sleep(15000) // Sleep for 15s for Hyperliquid confirm the txn
                    const confirmTransfer = await transferHyperliquidUSDCVaultToAccount((finalAmount/1e6).toFixed(2) , address)
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