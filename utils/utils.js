const crypto = require("crypto");

const generateRandomString = (length=20, encodingFormat="hex") => {
    return crypto.randomBytes(length).toString(encodingFormat);
}

const generateHash = (content, hashAlgorithm="sha256", encodingFormat="hex") => {
    return crypto.createHash(hashAlgorithm).update(content).digest(encodingFormat);
};

module.exports = { generateRandomString, generateHash };
