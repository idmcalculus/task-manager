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

		const newUser = new User({
			username: username.trim(),
			email: email.trim().toLowerCase(),
			password
		});

		await newUser.save();

		return res.status(201).json({ message: 'User registered successfully' });
	} catch (error) {
		return next(new ErrorHandler(500, 'Something went wrong. Please try again later'));
	}
};

exports.login = async (req, res, next) => {
	try {
		let { email, password } = req.body;

		console.log({ email, password });

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

		const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

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
		console.log({ session: req.session })
		
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
