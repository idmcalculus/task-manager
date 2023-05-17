const jwt = require('jsonwebtoken');
const { ErrorHandler } = require('../middleware/errorHandler');

exports.authorize = (req, res, next) => {
	try {
		const token = req.header('Authorization')?.split(' ')[1];
		if (!token) {
			return next(new ErrorHandler(401, 'No token, authorization denied'));
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const { isAdmin } = decoded.user;

		console.log('isAdmin', isAdmin)

		if (!isAdmin) {
			return next(new ErrorHandler(403, 'Not authorized to access this route'));
		}

		req.user = decoded;
		next();
	} catch (error) {
		return next(new ErrorHandler(401, 'Token is not valid'));
	}
};
