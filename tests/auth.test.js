const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const crypto = require('crypto');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

// Clear database between tests
beforeEach(async () => {
    await User.deleteMany({});
});

// Disconnect and close MongoDB connection
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Auth Routes', () => {
    // tests for user registration
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.nickname).toBe('');
            expect(res.body.data.email).toBe('test@example.com');
            expect(res.body.data.isEmailVerified).toBe(false);
        });

        it('should not register a user with existing email', async () => {
            await User.create({
                email: 'existing@example.com',
                password: 'password123',
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'existing@example.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Email already in use');
        });

        it('should validate email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
        });

        it('should require password to be at least 6 characters', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'short',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
        });
    });

    // tests for user login
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // create test user before each login test
            const user = new User({
                email: 'login@example.com',
                password: 'password123',
            });
            await user.save();
        });

        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123',
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.nickname).toBe('');
            expect(res.body.data.email).toBe('login@example.com');
        });

        it('should not login with incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword',
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid credentials! Wrong email or password');
        });

        it('should not login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid credentials! Wrong email or password');
        });

        it('should require email and password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Please provide a valid email address and password.');
        });
    });

    // tests for get user profile
    describe('GET /api/auth/profile', () => {
        let token;

        beforeEach(async () => {
            // create test user and get token before each test
            const user = new User({
                email: 'profile@example.com',
                password: 'password123',
            });
            await user.save();

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'profile@example.com',
                    password: 'password123',
                });

            token = loginRes.body.data.token;
        });

        it('should get user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.nickname).toBe('');
            expect(res.body.data.email).toBe('profile@example.com');
        });

        it('should not get profile without token', async () => {
            const res = await request(app).get('/api/auth/profile');

            expect(res.statusCode).toEqual(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Not authorized to access this route');
        });

        it('should not get profile with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalidtoken');

            expect(res.statusCode).toEqual(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Not authorized to access this route');
        });
    });

    // tests for email verification
    describe('GET /api/auth/verify-email/:token', () => {
        let verificationToken;
        let userId;

        beforeEach(async () => {
            // create test user and generate verification token before each test
            const user = new User({
                email: 'verify@example.com',
                password: 'password123',
            });

            verificationToken = crypto.randomBytes(20).toString('hex');
            const hashedToken = crypto
                .createHash('sha256')
                .update(verificationToken)
                .digest('hex');

            user.emailVerificationToken = hashedToken;
            user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

            await user.save();
            userId = user._id;
        });

        it('should verify email with valid token', async () => {
            const res = await request(app)
                .get(`/api/auth/verify-email/${verificationToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Email verified successfully');

            // check that user is now verified
            const updatedUser = await User.findById(userId);
            expect(updatedUser.isEmailVerified).toBe(true);
            expect(updatedUser.emailVerificationToken).toBeUndefined();
            expect(updatedUser.emailVerificationExpire).toBeUndefined();
        });

        it('should not verify with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/verify-email/invalidtoken');

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid or expired token');
        });

        it('should not verify with expired token', async () => {
            await User.findByIdAndUpdate(userId, {
                emailVerificationExpire: Date.now() - 1000 // update the token to be expired 1 second ago
            });

            const res = await request(app)
                .get(`/api/auth/verify-email/${verificationToken}`);

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid or expired token');
        });
    });

    // tests for forgot password
    describe('POST /api/auth/forgot-password', () => {
        beforeEach(async () => {
            await User.create({
                email: 'forgot@example.com',
                password: 'password123',
            });
        });

        it('should generate reset token for valid email', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({
                    email: 'forgot@example.com',
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Password reset email sent');

            // verify token was created
            const user = await User.findOne({ email: 'forgot@example.com' });
            expect(user.resetPasswordToken).toBeDefined();
            expect(user.resetPasswordExpire).toBeDefined();
        });

        it('should handle non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({
                    email: 'nonexistent@example.com',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('No user with that email');
        });

        it('should require an email', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({});

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Please provide an email');
        });
    });

    // tests for reset password
    describe('PUT /api/auth/reset-password/:token', () => {
        let resetToken;
        let userId;

        beforeEach(async () => {
            // create a user and generate a reset token before each test
            const user = new User({
                email: 'reset@example.com',
                password: 'oldpassword123',
            });

            resetToken = crypto.randomBytes(20).toString('hex');
            const hashedToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

            await user.save();
            userId = user._id;
        });

        it('should reset password with valid token', async () => {
            const res = await request(app)
                .put(`/api/auth/reset-password/${resetToken}`)
                .send({
                    password: 'newpassword123',
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Password reset successfully');

            // verify password was changed
            const updatedUser = await User.findById(userId).select('+password');
            const passwordMatch = await updatedUser.matchPassword('newpassword123');
            expect(passwordMatch).toBe(true);
            expect(updatedUser.resetPasswordToken).toBeUndefined();
            expect(updatedUser.resetPasswordExpire).toBeUndefined();
        });

        it('should not reset with invalid token', async () => {
            const res = await request(app)
                .put('/api/auth/reset-password/invalidtoken')
                .send({
                    password: 'newpassword123',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid or expired token');
        });

        it('should not reset with expired token', async () => {
            await User.findByIdAndUpdate(userId, {
                resetPasswordExpire: Date.now() - 1000 // update the token to be expired 1 second ago
            });

            const res = await request(app)
                .put(`/api/auth/reset-password/${resetToken}`)
                .send({
                    password: 'newpassword123',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid or expired token');
        });

        it('should require a new password', async () => {
            const res = await request(app)
                .put(`/api/auth/reset-password/${resetToken}`)
                .send({});

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Please provide a new password');
        });
    });

    // tests for change password
    describe('PUT /api/auth/change-password', () => {
        let token;
        let userId;

        beforeEach(async () => {
            // create user with known password for each test
            const user = new User({
                email: 'changepass@example.com',
                password: 'currentpassword',
            });
            await user.save();
            userId = user._id;

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'changepass@example.com',
                    password: 'currentpassword',
                });

            token = loginRes.body.data.token;
        });

        it('should change password with valid current password', async () => {
            const res = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'currentpassword',
                    newPassword: 'newpassword123',
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Password changed successfully');

            // verify password was changed
            const updatedUser = await User.findById(userId).select('+password');
            const passwordMatch = await updatedUser.matchPassword('newpassword123');
            expect(passwordMatch).toBe(true);
        });

        it('should not change password with incorrect current password', async () => {
            const res = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'wrongpassword',
                    newPassword: 'newpassword123',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Current password is incorrect');
        });

        it('should require both current and new passwords', async () => {
            const res = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'currentpassword',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Please provide current and new password');
        });

        it('should require authentication', async () => {
            const res = await request(app)
                .put('/api/auth/change-password')
                .send({
                    currentPassword: 'currentpassword',
                    newPassword: 'newpassword123',
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Not authorized to access this route');
        });
    });
});
