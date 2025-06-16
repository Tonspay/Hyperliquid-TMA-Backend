/**
 * This controller is to build a api request system for wallet
 */
const root = process.cwd();
require('dotenv').config();
var querystring = require('querystring');
var express = require('express');
const fs = require("fs");
var app = express();
var bodyParser = require('body-parser');
const modules = require("../../modules/index")
const redis = require("../../utils/redis")
const qr = require('qrcode');
const b58 = require("b58")
const auth = require("./middleware/auth");
const base32 = require('base32.js');
const baseUrl = process.env.BASEURL
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var logger = require('morgan');
app.use(logger('dev'));
app.use(logger(':method :url :status :res[content-length] - :response-time ms'));

const cors = require('cors');
const { send } = require('process');
app.use(cors())

app.listen(50008, async function() {
    console.log('web-server start')
})

async function sendSuccess(res, data) {
    if (!data) {
        data = "success"
    }
    return await res.status(200).send({
        "code": 200,
        "data": data
    })
}

async function sendErr(res, err) {
    if (!err) {
        err = "unknow error"
    }
    return await res.status(500).send({
        "code": 500,
        "error": err
    })
}

/**
 * Get
 */

//Ping
app.get('/ping', async function(req, res) {
    return sendSuccess(res)
})

app.get('/auth/ping',auth.auth, async function(req, res) {
    return sendSuccess(res.locals.auth)
})

app.post('/deposite', async function(req, res) {
    const address = req.body.address;
    const amount = Number(req.body.amount)
    if(amount < 3)
    {
        return await sendErr(res)
    }
    const ret = await modules.order.newOrder(address,amount,res);
    if(!ret)
    {
        return await sendErr(res);
    }
    
    return ret;
})

app.get('/deposite/:oid', async function(req, res) {
        const ret = await modules.order.checkOrder(req.params.oid);
        return res.status(200).send({
            "code": 200,
            "data": ret
        })
})
//INIT
async function init() {
    await redis.init()
}

module.exports = {
    init
}