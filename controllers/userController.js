const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ErrorHandler } = require('../middleware/errorHandler');

exports.register = async (req, res, next) => {
	try {
		const { username, email, password } = req.body;
		
		if (!username || !email || !password) {
			next(new ErrorHandler(400, 'Please provide all required fields'));
		}

		const existingUser = await User.findOne({ $or: [{ email }, { username }] });

		if (existingUser) {
			next(new ErrorHandler(400, 'User already exists'));
		}

		const hashedPassword = await bcrypt.hash(password, 12);

		const newUser = new User({ username, email, password: hashedPassword });
		await newUser.save();

		res.status(201).json({ message: 'User registered successfully' });
	} catch (error) {
		console.error(error);
		next(new ErrorHandler(500, 'Something went wrong. Please try again later'));
	}
};

exports.login = async (req, res, next) => {
	const { email, password } = req.body;

	try {
		const user = await User.findOne({ email });

		if (!user) {
			next(new ErrorHandler(404, 'User not found'));
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			next(new ErrorHandler(400, 'Invalid credentials'));
		}

		const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRATION,
		});

		res.status(200).json({ token, user });
	} catch (error) {
		next(new ErrorHandler(500, 'Something went wrong. Please try again later'));
	}
};
