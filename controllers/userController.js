const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ErrorHandler } = require('../middleware/errorHandler');

// Simple password check
function isStrongPassword(password) {
	return password && password.length >= 6;
}

// Basic email format check
function isValidEmailFormat(email) {
	const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return regex.test(email);
}

exports.register = async (req, res, next) => {
	try {
		const { username, email, password } = req.body;
		
		if (!username) {
			return next(new ErrorHandler(400, 'username is required'));
		}

		if (!email || !password) {
			return next(new ErrorHandler(400, 'Please provide all required fields'));
		}
	
		if (!isStrongPassword(password)) {
			return next(new ErrorHandler(400, 'Password is too weak'));
		}
	
		if (!isValidEmailFormat(email)) {
			return next(new ErrorHandler(400, 'Invalid email format'));
		}
	
		const trimmedUsername = username.trim();
		const lowerEmail = email.trim().toLowerCase();
	
		const existingUser = await User.findOne({
			$or: [{ email: lowerEmail }, { username: trimmedUsername }],
		});
	
		if (existingUser) {
			return next(new ErrorHandler(409, 'User already exists'));
		}
	
		const newUser = new User({
			username: trimmedUsername,
			email: lowerEmail,
			password
		});
	
		await newUser.save();
	
		// Return the user object with ID, username, email
		return res.status(201).json({
			_id: newUser._id,
			username: newUser.username,
			email: newUser.email
		});
	} catch (error) {
		return next(new ErrorHandler(500, 'Something went wrong. Please try again later'));
	}
};

exports.login = async (req, res, next) => {
	try {
		let { email, password } = req.body;

		if (!email || !password) {
			return next(new ErrorHandler(400, 'Please provide all required fields'));
		}

		email = email.trim().toLowerCase();

		const user = await User.findOne({ email });

		if (!user) {
			return next(new ErrorHandler(401, 'User not found'));
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return next(new ErrorHandler(401, 'Invalid credentials'));
		}

		// const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

		const token = jwt.sign(
			{ user: { _id: user._id, email: user.email, isAdmin: user.isAdmin } },
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRATION }
		);

		req.session.user = {
			id: user._id,
			email: user.email,
			username: user.username,
			token,
		};

        res.status(200).send('Logged in successfully');
	} catch (error) {
		console.error(error);
		return next(new ErrorHandler(500, 'Something went wrong. Please try again later'));
	}
};

exports.authenticate = async (req, res, next) => {
	try {
		const user = await req.session.user;

		if (user) {
			res.status(200).json(user);
		} else {
			return next(new ErrorHandler(401, 'Not authenticated'));
		}
	} catch (error) {
		console.error(error);
		return next(new ErrorHandler(500, 'Something went wrong. Please try again later'));
	}
};

exports.logout = async (req, res, next) => {
	try {
		req.session.destroy();
		res.clearCookie('sid');
		res.clearCookie('connect.sid');
		res.status(200).send('Logged out successfully');
	} catch (error) {
		return next(new ErrorHandler(500, 'Something went wrong. Please try again later'));
	}
}

exports.getUsers = async (req, res, next) => {
	try {
		const query = req.query.query;
		const users = await User.find({
			$or: [
				{ username: new RegExp(query, 'i') },
				{ email: new RegExp(query, 'i') }
			]
		});

		if (!users) {
			return next(new ErrorHandler(404, 'Users not found'));
		}

		res.json(users);
	} catch (error) {
		return next(new ErrorHandler(500, 'Something went wrong. Please try again later'));
	}
};
