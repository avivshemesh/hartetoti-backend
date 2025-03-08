const authService = require("../services/authService");

class AuthController {
    async register(req, res) {
        try {
            const userData = await authService.register(req.body);

            res.status(201).json({
                success: true,
                message: "Registration successful. Please verify your email.",
                data: userData,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid email address and password.",
                });
            }

            const userData = await authService.login(email, password);

            res.cookie('token', userData.token, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.status(200).json({
                success: true,
                message: "Successfully logged in",
                data: userData,
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message,
            });
        }
    }

    async getProfile(req, res) {
        try {
            const userData = await authService.getUserProfile(req.user._id);

            res.status(200).json({
                success: true,
                data: userData,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    async verifyEmail(req, res) {
        try {
            await authService.verifyEmail(req.params.token);

            res.status(200).json({
                success: true,
                message: "Email verified successfully",
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide an email"
                });
            }

            await authService.forgotPassword(email);

            res.status(200).json({
                success: true,
                message: "Password reset email sent",
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    async resetPassword(req, res) {
        try {
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a new password",
                })
            }

            await authService.resetPassword(req.params.token, password);
            res.status(200).json({
                success: true,
                message: "Password reset successfully",
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide current and new password"
                });
            }
            await authService.changePassword(req.user._id, currentPassword, newPassword);

            res.status(200).json({
                success: true,
                message: "Password changed successfully",
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new AuthController();
