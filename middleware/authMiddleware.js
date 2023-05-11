const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = (req, res, next) => {
	const token = req.header('Authorization')?.split(' ')[1];

	if (!token) {
		return res.status(401).json({ message: 'No token, authorization denied' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		res.status(401).json({ message: 'Token is not valid' });
	}
};

exports.authorize = (req, res, next) => {
	// Add your authorization logic here
	// For example, check if the authenticated user has a specific role
	next();
};
