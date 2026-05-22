const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/user');
const Submission = require('../models/submission');
const redisClient = require('../config/redis');
const { updateStreaks } = require('../utils/utils');


const generateToken = (user) => {
    return jwt.sign(
        {
            _id: user._id,
            username: user.username,
            emailId: user.emailId,
            role: user.role
        },
        process.env.SECRET_KEY,
        { expiresIn: '7d' }
    );
};

const createUserResponse = (user) => {
    return {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        emailId: user.emailId,
        role: user.role,
        avatar: user.avatar,
        provider: user.provider,
        emailVerified: user.emailVerified,
        totalProblemsSolved: user.totalProblemsSolved || 0,
        points: user.points || 0,
        streaks: user.streaks || { current: 0, longest: 0, lastUpdated: new Date() },
        likedProblems: user.likedProblems || [],
        favouriteProblems: user.favouriteProblems || [],
        bookmarkedProblems: user.bookmarks ? user.bookmarks.flatMap(b => b.problems || []) : []
    };
};


const register = async (req, res) => {
    try {
        const { fullName, emailId, password } = req.body;

       
        if (!fullName || !emailId || !password) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email, and password are required'
            });
        }

        if (fullName.trim().length < 2 || fullName.trim().length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Full name must be between 2 and 50 characters'
            });
        }

        if (!validator.isEmail(emailId)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        if (!validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        })) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol'
            });
        }

        
        const existingUser = await User.findOne({ emailId });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);

       
        const baseUsername = emailId.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
        let username = baseUsername;
        let counter = 1;

        // Ensure unique username for no duplicate username
        while (await User.findOne({ username })) {
            username = `${baseUsername}${counter}`;
            counter++;
        }

        
        const newUser = new User({
            fullName,
            username,
            emailId,
            password: hashedPassword,
            role: 'user',
            provider: 'local',
            points: 0,
            totalProblemsSolved: 0,
            streaks: {
                current: 0,
                longest: 0,
                lastUpdated: new Date()
            }
        });

        await newUser.save();

    
        const token = generateToken(newUser);

        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome!',
            user: createUserResponse(newUser)
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;

        if (!emailId || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        if (!validator.isEmail(emailId)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }
        const user = await User.findOne({ emailId });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (user.provider === 'google') {
            return res.status(400).json({
                success: false,
                message: 'This account is registered with Google. Please use Google Sign-In.'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        if (!user.streaks) {
            user.streaks = { current: 0, longest: 0, lastUpdated: new Date() };
        }
        // Update streaks on login
        const updatedStreaks = updateStreaks(user.streaks);
        user.streaks = updatedStreaks;
        await user.save();

        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // cross-site cookies for production, lax for development
        });

        res.status(200).json({
            success: true,
            message: user.role === 'admin' ? 'Welcome back, Admin!' : 'Login successful!',
            user: createUserResponse(user)
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const googleAuth = async (req, res) => {
    try {
        const { googleUser } = req; 
        const { googleId, emailId, fullName, avatar, emailVerified } = googleUser;

        if (!emailId) {
            return res.status(400).json({ success: false, message: 'Google did not provide an email.' });
        }

        let user = await User.findOne({ googleId });

        if (user) {
            user.avatar = avatar;
            user.emailVerified = emailVerified;

            // Update streaks on login
            if (!user.streaks)
                user.streaks = { current: 0, longest: 0, lastUpdated: new Date() };
                const updatedStreaks = updateStreaks(user.streaks);
                user.streaks = updatedStreaks;

            await user.save();
        } else {

            const existingUser = await User.findOne({ emailId });

            if (existingUser && existingUser.provider === 'local') {
                return res.status(400).json({
                    success: false,
                    message: 'An account with this email already exists. Please sign in with your password.'
                });
            }

            
            const baseUsername = emailId.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
            let username = baseUsername;
            let counter = 1;

            while (await User.findOne({ username })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            user = new User({
                googleId,
                username,
                fullName: fullName || 'User',
                emailId: emailId,
                avatar,
                provider: 'google',
                emailVerified,
                role: 'user',
                points: 0,
                totalProblemsSolved: 0,
                streaks: {
                    current: 0,
                    longest: 0,
                    lastUpdated: new Date()
                }
            });

            await user.save();
        }

        const token = generateToken(user);

   
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        res.status(200).json({
            success: true,
            message: user.role === 'admin' ? 'Welcome back, Admin!' : 'Google authentication successful!',
            user: createUserResponse(user)
        });

    } catch (error) {
        console.error('Google auth error:', error);
        console.error(error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const logout = async (req, res) => {
    try {
        const { token } = req.cookies;

        if (token) {
           
            const payload = jwt.decode(token);

            // Add to Redis blocklist
            await redisClient.set(`token:${token}`, 'Blocked');
            if (payload?.exp) {
                await redisClient.expireAt(`token:${token}`, payload.exp);
            }
        }

        res.cookie('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            expires: new Date(0)
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const checkAuth = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(200).json({
                success: true,
                isAuthenticated: false,
                message: 'No token provided'
            });
        }

       
        const isBlocked = await redisClient.exists(`token:${token}`);
        if (isBlocked === 1) {
            res.clearCookie('token');
            return res.status(200).json({
                success: true,
                isAuthenticated: false,
                message: 'Token is invalid'
            });
        }

        
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findById(decoded._id);

        if (!user) {
            res.clearCookie('token');
            return res.status(200).json({
                success: true,
                isAuthenticated: false,
                message: 'User not found'
            });
        }

        // Update streaks on auth check (daily visit)
        const updatedStreaks = updateStreaks(user.streaks);
        if (
            updatedStreaks.current !== user.streaks.current ||
            updatedStreaks.longest !== user.streaks.longest
        ) {
            user.streaks = updatedStreaks;
            await user.save();
        }

        res.status(200).json({
            success: true,
            isAuthenticated: true,
            user: createUserResponse(user)
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            res.clearCookie('token');
            return res.status(200).json({
                success: true,
                isAuthenticated: false,
                message: 'Invalid or expired token'
            });
        }

        console.error('Auth check error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteProfile = async (req, res) => {
    try {
        const userId = req.user._id; 

       await Submission.deleteMany({ userId });
        console.log(`Deleted all submissions for user: ${userId}`);

        await User.findByIdAndDelete(userId);

        res.clearCookie('token');

        res.status(200).json({
            success: true,
            message: 'User profile and all submissions deleted successfully'
        });

    } catch (error) {
        console.error('Delete profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


const promoteToAdmin = async (req, res) => {
    try {
        const { userId } = req.body;

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'User is already an admin'
            });
        }

        user.role = 'admin';
        await user.save();

       res.status(200).json({
            success: true,
            message: `${user.fullName} promoted to admin`,
            userId: user._id 
        });

    } catch (error) {
        console.error('Promote user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot delete yourself." });
        }

        
        await Submission.deleteMany({ userId });

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ 
            message: 'User deleted successfully',
            userId: userId
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete user' });
    }
};


const getAllUsers = async (req, res) => {
    try {

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const users = await User.find({}, '-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users: users
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    register,
    login,
    googleAuth,
    logout,
    checkAuth,
    deleteProfile,
    promoteToAdmin,
    getAllUsers,
    deleteUser
};
