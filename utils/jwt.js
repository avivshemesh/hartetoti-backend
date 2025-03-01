const jwt = require("jsonwebtoken")

const generateToken = (id) => {
    console.log("JWT_SECRET:", process.env.JWT_SECRET);
    console.log("JWT_EXPIRES:", process.env.JWT_EXPIRES);
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES,
    });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.log(`Unable to verify token: ${token}`);
        return null;
    }
}

module.exports = { generateToken, verifyToken };
