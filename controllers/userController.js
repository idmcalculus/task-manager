const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ErrorHandler } = require('../middleware/errorHandler');

exports.register = async (req, res, next) => {
	try {
		const { username, email, password } = req.body;
		
		if (!username || !email || !password) {
			return next(new ErrorHandler(400, 'Please provide all required fields'));
		}

		const existingUser = await User.findOne({ $or: [{ email }, { username }] });

		if (existingUser) {
			return next(new ErrorHandler(400, 'User already exists'));
		}

		const newUser = new User(req.body);
		await newUser.save();

		return res.status(201).json({ message: 'User registered successfully' });
	} catch (error) {
		return next(new ErrorHandler(500, 'Something went wrong. Please try again later'));
	}
};

exports.login = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return next(new ErrorHandler(400, 'Please provide all required fields'));
		}

		const user = await User.findOne({ email });

		if (!user) {
			return next(new ErrorHandler(401, 'User not found'));
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return next(new ErrorHandler(401, 'Invalid credentials'));
		}

		const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

		req.session.user = { ...user, token };
        res.status(200).send('Logged in successfully');
	} catch (error) {
		return next(new ErrorHandler(500, 'Something went wrong. Please try again later'));
	}
};

exports.authenticate = async (req, res, next) => {
	try {
		if (!req.session.user) {
			return next(new ErrorHandler(401, 'Not authenticated'));
		}

		res.status(200).json(req.session.user);
	} catch (error) {
		return next(new ErrorHandler(500, 'Something went wrong. Please try again later'));
	}
};

exports.logout = async (req, res, next) => {
	try {
		req.session.destroy();
		res.clearCookie('connect.sid');
		res.status(200).send('Logged out successfully');
	} catch (error) {
		return next(new ErrorHandler(500, 'Something went wrong. Please try again later'));
	}
}
