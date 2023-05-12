class ErrorHandler extends Error {
	constructor(statusCode, message) {
		super();
		this.statusCode = statusCode;
		this.message = message;
	}
}
  
const handleError = (err, req, res, next) => {
	const { statusCode, message } = err;

	res.status(statusCode || 500).json({
		status: 'error',
		statusCode: statusCode || 500,
		message: message || 'An error occurred while processing your request.',
	});
};
  
module.exports = {
	ErrorHandler,
	handleError,
};
  