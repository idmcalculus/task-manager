const chai = require('chai');
const chaiHttp = require('chai-http');
const { request } = chaiHttp;
const jwt = require('jsonwebtoken');
const { ErrorHandler } = require('../middleware/errorHandler');
const { authorize } = require('../middleware/authMiddleware');
const app = require('../index');

const { expect } = chai;
chai.use(chaiHttp);

describe('Middleware', () => {
  describe('Error Handler', () => {
    it('should create error with status code and message', () => {
      const error = new ErrorHandler(400, 'Test error');
      expect(error).to.be.instanceOf(Error);
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.equal('Test error');
    });
  });

  describe('Auth Middleware', () => {
    let validToken;
    let invalidToken = 'invalid.token.here';

    before(() => {
      // Create a valid token for testing
      validToken = jwt.sign(
        { user: { id: '123', isAdmin: true } },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should authorize requests with valid token', (done) => {
      chai
        .request(app)
        .get('/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should reject requests with invalid token', (done) => {
      chai
        .request(app)
        .get('/v1/tasks')
        .set('Authorization', `Bearer ${invalidToken}`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('not valid');
          done();
        });
    });

    it('should reject requests with no token', (done) => {
      chai
        .request(app)
        .get('/v1/tasks')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('No token');
          done();
        });
    });

    it('should reject non-admin users', (done) => {
      const nonAdminToken = jwt.sign(
        { user: { id: '123', isAdmin: false } },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      chai
        .request(app)
        .get('/v1/tasks')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('Not authorized');
          done();
        });
    });
  });
});
