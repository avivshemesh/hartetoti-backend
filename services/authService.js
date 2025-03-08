const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const { generateHash } = require("../utils/utils");

class AuthService {
    async register(userData) {
        const { email, password, confirmPassword } = userData;

        if (password !== confirmPassword) {
            throw new Error("password and confirm password do not match");
        }

        const userExists = await User.findOne({
            $or: [{ email: email }]
        });

        if (userExists) {
            if (userExists.email === email) {
                throw new Error("Email already in use");
            }
        }

        const newUser = new User({
            password,
            email,
        });

        const verificationToken = newUser.generateEmailVerificationToken();
        console.log("Generated email token:", verificationToken);

        await newUser.save();

        const jwtToken = generateToken(newUser._id);
        console.log("Generated jwt token:", jwtToken);

        return {
            _id: newUser._id,
            nickname: newUser.nickname,
            email: newUser.email,
            role: newUser.role,
            isEmailVerified: newUser.isEmailVerified,
            token: jwtToken,
        };
    }

    async login(email, password) {
        const user = await User.findOne({ email }).select("+password");
        const err = "Invalid credentials! Wrong email or password"

        if (!user) {
            throw new Error(err);
        }

        const isPwMatch = await user.matchPassword(password);
        if (!isPwMatch) {
            throw new Error(err);
        }

        const jwtToken = generateToken(user._id);

        return {
            _id: user._id,
            nickname: user.nickname,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            token: jwtToken,
        };
    }

    async getUserProfile(userId) {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error(`User '${userId}' not found`);
        }

        return {
            _id: user._id,
            nickname: user.nickname,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified
        };
    }

    async verifyEmail(verificationToken) {
        const emailVerificationToken = generateHash(verificationToken)

        const user = await User.findOne({
            emailVerificationToken,
            emailVerificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            throw new Error("Invalid or expired token");
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;

        await user.save();

        return true;
    }

    async forgotPassword(email) {
        const user = await User.findOne({ email });

        if (!user) {
            throw new Error("No user with that email");
        }

        const resetToken = user.generateResetPasswordToken();
        await user.save();

        //TODO Send email with reset link using Nodemailer (implement later)

        return true;
    }

    async resetPassword(resetToken, newPassword) {
        const resetPasswordToken = generateHash(resetToken);

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            throw new Error("Invalid or expired token");
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return true;
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await User.findById(userId).select("+password");

        if (!user) {
            throw new Error("User not found");
        }

        const isPwMatch = await user.matchPassword(currentPassword);
        if (!isPwMatch) {
            throw new Error("Current password is incorrect");
        }

        user.password = newPassword;
        await user.save();

        return true;
    }
}

module.exports = new AuthService();
