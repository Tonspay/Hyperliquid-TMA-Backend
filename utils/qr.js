const qr = require('qrcode');

async function newQR(data)
{
    return await qr.toBuffer(data);
}

module.exports = {
    newQR
}