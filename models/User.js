const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	isAdmin: { type: Boolean, default: false }
},
{ collection: 'users', timestamps: true});

UserSchema.pre('save', async function(next) {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 12);
	}
  	next();
});

UserSchema.methods.comparePassword = function(plainPassword, cb) {
	bcrypt.compare(plainPassword, this.password, (err, isMatch) => {
		if (err) return cb(err);
		cb(null, isMatch);
	});
};

UserSchema.set('toJSON', {
	transform: (document, returnedObject) => {
	  returnedObject.id = returnedObject._id.toString();
	  delete returnedObject._id;
	  delete returnedObject.__v;
	}
});

module.exports = mongoose.model('User', UserSchema);
