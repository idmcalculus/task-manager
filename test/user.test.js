const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('..');
const { expect } = chai;

chai.use(chaiHttp);

let testUser;
let authToken;

describe('User API', () => {
  let adminToken;

  // Clean up database before tests
  before(async () => {
    await User.deleteMany({});

    // Create an admin user for testing protected routes
    const adminUser = {
      username: `admin${Date.now()}`,
      email: `admin${Date.now()}@example.com`,
      password: 'Admin123!@#',
      isAdmin: true
    };

    const adminRes = await chai
      .request(app)
      .post('/v1/users/register')
      .send(adminUser);

    const adminLogin = await chai
      .request(app)
      .post('/v1/users/login')
      .send({
        email: adminUser.email,
        password: adminUser.password
      });

    adminToken = adminLogin.body.token;
  });

  describe('POST /register', () => {
    it('should validate password strength', (done) => {
      const weakPasswordUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123'
      };

      chai
        .request(app)
        .post('/v1/users/register')
        .send(weakPasswordUser)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('password');
          done();
        });
    });

    it('should validate email format', (done) => {
      const invalidEmailUser = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Test123!@#'
      };

      chai
        .request(app)
        .post('/v1/users/register')
        .send(invalidEmailUser)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('email');
          done();
        });
    });

    it('should trim whitespace from username', (done) => {
      const userWithWhitespace = {
        username: '  testuser  ',
        email: 'test@example.com',
        password: 'Test123!@#'
      };

      chai
        .request(app)
        .post('/v1/users/register')
        .send(userWithWhitespace)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(201);
          expect(res.body.username).to.equal('testuser');
          done();
        });
    });
    it('should register a new user', (done) => {
      const newUser = {
        username: `test${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!@#'
      };

      testUser = newUser;

      chai
        .request(app)
        .post('/v1/users/register')
        .send(newUser)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('_id');
          expect(res.body).to.have.property('username', newUser.username);
          expect(res.body).to.have.property('email', newUser.email);
          expect(res.body).to.not.have.property('password');
          done();
        });
    });

    it('should return an error if username is missing', (done) => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'Test123!@#'
      };
      
      chai
        .request(app)
        .post('/v1/users/register')
        .send(invalidUser)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('username');
          done();
        });
    });

    it('should return an error if email is invalid', (done) => {
      const invalidUser = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Test123!@#'
      };
      
      chai
        .request(app)
        .post('/v1/users/register')
        .send(invalidUser)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('email');
          done();
        });
    });

    it('should return an error if password is too short', (done) => {
      const invalidUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123'
      };
      
      chai
        .request(app)
        .post('/v1/users/register')
        .send(invalidUser)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('password');
          done();
        });
    });

    it('should return an error if the user already exists', (done) => {
      chai
        .request(app)
        .post('/v1/users/register')
        .send(testUser)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('exists');
          done();
        });
    });
  });

  describe('POST /login', () => {
    it('should handle case-insensitive email', (done) => {
      const loginCredentials = {
        email: testUser.email.toUpperCase(),
        password: testUser.password
      };

      chai
        .request(app)
        .post('/v1/users/login')
        .send(loginCredentials)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('token');
          done();
        });
    });

    it('should handle missing credentials', (done) => {
      chai
        .request(app)
        .post('/v1/users/login')
        .send({})
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('required');
          done();
        });
    });
    it('should log in a user and return a valid JWT token', (done) => {
      const loginCredentials = {
        email: testUser.email,
        password: testUser.password
      };

      chai
        .request(app)
        .post('/v1/users/login')
        .send(loginCredentials)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('token');
          
          // Verify token is valid JWT
          const decodedToken = jwt.verify(res.body.token, process.env.JWT_SECRET);
          expect(decodedToken).to.have.property('userId');
          expect(decodedToken).to.have.property('email', testUser.email);
          
          authToken = res.body.token;
          done();
        });
    });

    it('should return an error if email is not provided', (done) => {
      const invalidCredentials = {
        password: 'Test123!@#'
      };
      
      chai
        .request(app)
        .post('/v1/users/login')
        .send(invalidCredentials)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('email');
          done();
        });
    });

    it('should return an error if password is incorrect', (done) => {
      const invalidCredentials = {
        email: testUser.email,
        password: 'wrongpassword'
      };
	  
			chai
        .request(app)
        .post('/v1/users/login')
        .send(invalidCredentials)
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
