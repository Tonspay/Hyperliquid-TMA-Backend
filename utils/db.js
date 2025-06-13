var MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
    //DB name
const mainDB = process.env.SQL_DB

//Sheet name
const sUser = "users";
const sUserInfo = "user_information";
const sOrders = "orders"

const sRecord = "record";
const sRecordIndex = "record_index"
//DB struct
/**
 * User sytstem 
 */

async function newAccount(data,invite) {
    if ((await getAccountByAddress(data.address)).length > 0) {
        return false;
    }
    data['invite'] = invite || 0;
    const pool = await MongoClient.connect(process.env.SQL_HOST)
    var db = pool.db(mainDB);
    var ret = await db.collection(sUser).insertOne(data);
    await pool.close();
    return ret;
}
async function getAccountByAddress(address) {
    const pool = await MongoClient.connect(process.env.SQL_HOST)
    var db = pool.db(mainDB);
    var ret = await db.collection(sUser).find({
        address
    }).project({_id:0}).toArray();
    await pool.close();
    return ret;
}

async function getAccountById(uid) {
    const pool = await MongoClient.connect(process.env.SQL_HOST)
    var db = pool.db(mainDB);
    var ret = await db.collection(sUser).find({
        id: uid
    }).project({_id:0}).toArray();
    await pool.close();
    return ret;
}
async function newAccountInfo(data) {
    const pool = await MongoClient.connect(process.env.SQL_HOST);
    const db = pool.db(mainDB);
    const ret = await db.collection(sUserInfo).updateOne(
        { uid: data.uid },
        { $set: data },
        { upsert: true }
    );
    await pool.close();
    return ret;
}
async function getAccountInfoById(uid) {
    const pool = await MongoClient.connect(process.env.SQL_HOST)
    var db = pool.db(mainDB);
    var ret = await db.collection(sUserInfo).find({
        uid: uid
    }).project({_id:0}).toArray();
    await pool.close();
    return ret;
}

async function newAccountKycInfo(data) {
    const pool = await MongoClient.connect(process.env.SQL_HOST);
    const db = pool.db(mainDB);
    const ret = await db.collection(sUserKyc).updateOne(
        { uid: data.uid },
        { $set: data },
        { upsert: true }
    );
    await pool.close();
    return ret;
}
async function getAccountKycInfoById(uid) {
    const pool = await MongoClient.connect(process.env.SQL_HOST)
    var db = pool.db(mainDB);
    var ret = await db.collection(sUserKyc).find({
        id: uid
    }).project({}).toArray();
    await pool.close();
    return ret;
}

async function newRecord(data) {
    const pool = await MongoClient.connect(process.env.SQL_HOST);
    const db = pool.db(mainDB);
    const ret = await db.collection(sRecord).updateOne(
        { hash: data.hash },
        { $set: data },
        { upsert: true }
    );
    await pool.close();
    return ret;
}

async function newRecordIndex(data) {
    const pool = await MongoClient.connect(process.env.SQL_HOST);
    const db = pool.db(mainDB);
    const ret = await db.collection(sRecordIndex).updateOne(
        { chain: data.chain },
        { $set: data },
        { upsert: true }
    );
    await pool.close();
    return ret;
}
async function getRecordIndex(fliter) {
    const pool = await MongoClient.connect(process.env.SQL_HOST)
    var db = pool.db(mainDB);
    var ret = await db.collection(sRecordIndex).find(fliter).project({}).toArray();
    await pool.close();
    return ret.length>0 ? ret[0] : false;
}

async function updateOrder(data) {
    const pool = await MongoClient.connect(process.env.SQL_HOST);
    const db = pool.db(mainDB);
    const ret = await db.collection(sOrders).updateOne(
        { 
            id: data.id,
            token:data.token
         },
        { $set: data },
        { upsert: true }
    );
    await pool.close();
    return ret;
}

async function getOrder(fliter) {
    const pool = await MongoClient.connect(process.env.SQL_HOST)
    var db = pool.db(mainDB);
    var ret = await db.collection(sOrders).find(fliter).project({}).toArray();
    await pool.close();
    return ret.length>0 ? ret[0] : false;
}
module.exports = {
    //User
    newAccount,
    getAccountById,
    newAccountInfo,
    getAccountInfoById,
    newAccountKycInfo,
    getAccountKycInfoById,
    getAccountByAddress,

    //Monitor
    newRecord,
    newRecordIndex,
    getRecordIndex,
    updateOrder,
    getOrder

}