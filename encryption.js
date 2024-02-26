// encryption.js
require('dotenv').config();
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
// Note: Future implementation should replace this with dynamic key generation and secure key exchange

const secretKey = crypto.createHash('sha256').update(String(process.env.SECRET_KEY)).digest('base64').substr(0, 32);
const ivLength = 16; // AES block size in bytes

const encryptMessage = (text, sessionKey = secretKey) => {
    const iv = crypto.randomBytes(ivLength);

    const cipher = crypto.createCipheriv(algorithm, sessionKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};

const decryptMessage = (hash, sessionKey = secretKey) => {
    const decipher = crypto.createDecipheriv(algorithm, sessionKey, Buffer.from(hash.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

    return decrypted.toString();
};

module.exports = {
    encryptMessage,
    decryptMessage
};
