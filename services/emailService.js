const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

const transporter = nodemailer.createTransport(emailConfig);

exports.sendEmail = async (to, subject, text) => {
	try {
		const info = await transporter.sendMail({ from: 'idm.calculus@gmail.com', to, subject, text });
		console.log(`Email sent: ${info.messageId}`);
	} catch (error) {
		console.error(`Error sending email: ${error}`);
	}
};
