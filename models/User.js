const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { generateRandomString, generateHash } = require("../utils/utils");

const UserSchema = new mongoose.Schema({
    nickname: {
        type: String,
        trim: true,
        minlength: 0,
        maxlength: 20,
        default: ""
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minlength: 6,
        select: false
    },
    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
        match: [
            /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
            "Please provide a valid email"
        ]
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generateEmailVerificationToken = function() {
    const verificationToken = generateRandomString();
    this.emailVerificationToken = generateHash(verificationToken);
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

    return verificationToken;
}

UserSchema.methods.generateResetPasswordToken = function() {
    const resetToken = generateRandomString();
    this.resetPasswordToken = generateHash(resetToken);
    this.resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000;

    return resetToken;
}

const User = mongoose.model("User", UserSchema);
module.exports = User;
