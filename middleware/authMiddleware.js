const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ErrorHandler } = require('../middleware/errorHandler');

exports.authenticate = (req, res, next) => {
	const token = req.header('Authorization')?.split(' ')[1];

	if (!token) {
		return next(new ErrorHandler(401, 'No token, authorization denied'));
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		return next(new ErrorHandler(401, 'Token is not valid'));
	}
};

exports.authorize = (req, res, next) => {
	const { isAdmin } = req.user;

    if (!isAdmin) {
        return next(new ErrorHandler(403, 'Not authorized to access this route'));
    }

    next();
};
