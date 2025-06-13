const db = require("../../utils/db")

async function userLogin(udata,address,invite) {
    await db.newAccount(udata,invite);
    let baseInfo =await  db.getAccountByAddress(address)
    if(baseInfo.length>0)
    {
        baseInfo = baseInfo[0]
    }else{
        return false
    }
    
    return baseInfo
}

async function userSign(uid) {
    let baseInfo =await  db.getAccountById(uid)
    console.log(String(uid),baseInfo)
    if(baseInfo.length>0)
    {
        baseInfo = baseInfo[0]
    }else{
        return false
    }
    return  baseInfo;
}

module.exports = {
    userLogin,
}