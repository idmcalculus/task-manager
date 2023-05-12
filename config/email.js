require('dotenv').config();

module.exports = {
	host: process.env.SMTP_SERVER,
	port: 465,
	secure: true,
	auth: {
		user: process.env.SMTP_USERNAME,
		pass: process.env.SMTP_PASSWORD,
	},
};
  