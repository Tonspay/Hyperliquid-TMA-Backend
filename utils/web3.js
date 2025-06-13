const hl = require("@nktkas/hyperliquid");

const ethers = require("ethers")

const cfg = require("../config").cfg

require('dotenv').config();

const provider = new ethers.providers.JsonRpcProvider(process.env.EVM_PROVIDER);

const wallet = new ethers.Wallet(process.env.EVM_KP,provider);

const usdc = new ethers.Contract(cfg.contract.tokens.usdc, cfg.contract.tokens.abi, wallet);

async function depositeToHyperliquid(amount) {
  try {
    //Deposite the balance into vault on Hyperliquid via transfer 
    const tx = await usdc.transfer(cfg.contract.bridge.address, amount);
    const receipt = await tx.wait();
    return tx.hash;
  } catch (err) {
    console.error(err)
    return false;
  }
}

async function transferHyperliquidUSDCVaultToAccount(amount,address)
{
    const exchClient = new hl.ExchangeClient({ wallet: wallet, transport });
    const transfer = await exchClient.usdSend(
      {
        destination:address,
        amount:amount,
      }
    )
    console.log(transfer)
    return transfer
}
module.exports = {
    depositeToHyperliquid,
    transferHyperliquidUSDCVaultToAccount
}