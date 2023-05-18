const multer = require('multer');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/');
	},
	filename: (req, file, cb) => {
		// remove spaces from original filename, replace with dashes
		const filename = file.originalname.replace(/\s+/g, '-').toLowerCase();
		cb(null, Date.now() + '-' + filename);
	},
});

const upload = multer({ storage });

module.exports = upload;
