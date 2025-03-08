const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

const protect = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized to access this route"
        });
    }

    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Not authorized to access this route"
            });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Not authorized to access this route"
        });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Not authorized as admin"
        });
    }
};

module.exports = { protect, admin };
