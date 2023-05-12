const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('..');
const expect = chai.expect;

chai.use(chaiHttp);

describe('User API', () => {
	describe('POST /register', () => {
		it('should register a new user', (done) => {
			const newUser = {
				username: `test${Date.now()}`,
				email: `test${Date.now()}@example.com`,
				password: 'test123',
			};

			chai
			.request(app)
			.post('/v1/users/register')
			.send(newUser)
			.end((err, res) => {
				expect(err).to.be.null;
				expect(res).to.have.status(201);
				done();
			});
		});

		it('should return an error if a credential (e.g email) is not provided', (done) => {
			const invalidUser = {
				username: 'test',
			  	password: 'test123',
			};
	  
			chai
			.request(app)
			.post('/v1/users/register')
			.send(invalidUser)
			.end((err, res) => {
				expect(res).to.have.status(400);
				expect(res.body).to.have.property('message');
				done();
			});
		});

		it('should return an error if the user already exists', (done) => {
			const existingUser = {
				email: 'test@example.com',
				password: 'test123',
			};
	  
			chai
			.request(app)
			.post('/v1/users/register')
			.send(existingUser)
			.end((err, res) => {
				expect(res).to.have.status(400);
				expect(res.body).to.have.property('message');
				done();
			});
		});
	});

	describe('POST /login', () => {
		it('should log in a user and return a token', (done) => {
			const user = {
				email: 'test@example.com',
				password: 'test123',
			};

			chai
			.request(app)
			.post('/v1/users/login')
			.send(user)
			.end((err, res) => {
				expect(err).to.be.null;
				expect(res).to.have.status(200);
				expect(res.body).to.have.property('token');
				done();
			});
		});

		it('should return an error if email is not provided', (done) => {
			const invalidUser = {
			  	password: 'test123',
			};
	  
			chai
			.request(app)
			.post('/v1/users/login')
			.send(invalidUser)
			.end((err, res) => {
				expect(res).to.have.status(400);
				expect(res.body).to.have.property('message');
				done();
			});
		});

		it('should return an error if password is incorrect', (done) => {
			const userWithIncorrectPassword = {
				email: 'test@example.com',
				password: 'wrongpassword',
			};
	  
			chai
			.request(app)
			.post('/v1/users/login')
			.send(userWithIncorrectPassword)
			.end((err, res) => {
				expect(res).to.have.status(401);
				expect(res.body).to.have.property('message');
				done();
			});
		});

		it('should return an error if the user does not exist', (done) => {
			const nonExistentUser = {
				email: 'nonexistent@example.com',
				password: 'test123',
			};
	  
			chai
			.request(app)
			.post('/v1/users/login')
			.send(nonExistentUser)
			.end((err, res) => {
				expect(res).to.have.status(401);
				expect(res.body).to.have.property('message');
				done();
			});
		});
	});
});
