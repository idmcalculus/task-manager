const sanitizeHtml = require('sanitize-html');

const sanitizeTaskData = (req, res, next) => {
	req.body.title = sanitizeHtml(req.body.title || '');
	req.body.description = sanitizeHtml(req.body.description || '');
	req.body.status = sanitizeHtml(req.body.status || '');
	req.body.assignedTo = sanitizeHtml(req.body.assignedTo || '');
	req.body.dueDate = sanitizeHtml(req.body.dueDate || '');
	req.body.priority = sanitizeHtml(req.body.priority || '');
	req.body.createdBy = sanitizeHtml(req.body.createdBy || '');

	// Remove empty strings to allow defaults to work
	Object.keys(req.body).forEach(key => {
		if (req.body[key] === '') {
			delete req.body[key];
		}
	});

	next();
};

const sanitizeUserData = (req, res, next) => {
	req.body.username = sanitizeHtml(req.body.username);
	req.body.email = sanitizeHtml(req.body.email);
	req.body.password = sanitizeHtml(req.body.password);
	next();
};

module.exports = {
	sanitizeTaskData,
	sanitizeUserData,
};
