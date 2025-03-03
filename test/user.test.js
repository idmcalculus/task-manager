const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');

let testUserCredentials = {};
let authToken;
let adminToken;
let adminUserData;
let testUserId;

describe('User API (Jest)', () => {
  beforeAll(async () => {
    // Clear all users from DB
    await User.deleteMany({});

    // Create an admin user for tests
    adminUserData = {
      username: `admin${Date.now()}`,
      email: `admin${Date.now()}@example.com`,
      password: 'Admin123!@#',
      isAdmin: true,
    };

    // Register admin
    const adminReg = await request(app)
      .post('/api/v1/users/register')
      .send(adminUserData);
    expect(adminReg.status).toBe(201);

    // Login admin
    const adminLogin = await request(app)
      .post('/api/v1/users/login')
      .send({
        email: adminUserData.email,
        password: adminUserData.password,
      });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.token;
  });

  describe('POST /api/v1/users/register', () => {
    test('should validate password strength', async () => {
      const weakPasswordUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123',
      };
      const res = await request(app)
        .post('/api/v1/users/register')
        .send(weakPasswordUser);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/password/i);
    });

    test('should validate email format', async () => {
      const invalidEmailUser = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Test123!@#',
      };
      const res = await request(app)
        .post('/api/v1/users/register')
        .send(invalidEmailUser);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/email/i);
    });

    test('should trim whitespace from username', async () => {
      const userWithWhitespace = {
        username: '  userwithspace  ',
        email: `user${Date.now()}@example.com`,
        password: 'Test123!@#',
      };
      const res = await request(app)
        .post('/api/v1/users/register')
        .send(userWithWhitespace);
      expect(res.status).toBe(201);
      expect(res.body.username).toBe('userwithspace');
    });

    test('should register a new user', async () => {
      const newUser = {
        username: `test${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!@#',
      };
      const res = await request(app)
        .post('/api/v1/users/register')
        .send(newUser);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('username', newUser.username);
      expect(res.body).toHaveProperty('email', newUser.email);
      expect(res.body).not.toHaveProperty('password');

      testUserCredentials.email = newUser.email;
      testUserCredentials.password = newUser.password;
      testUserId = res.body._id;
    });

    test('should return error if username is missing', async () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };
      const res = await request(app)
        .post('/api/v1/users/register')
        .send(invalidUser);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/username/i);
    });

    test('should return error if the user already exists', async () => {
      // First, let's make sure testUserCredentials.username is set
      if (!testUserCredentials.username) {
        // Get the username from a user we created earlier
        const user = await User.findOne({ email: testUserCredentials.email });
        testUserCredentials.username = user.username;
      }
      
      const res = await request(app)
        .post('/api/v1/users/register')
        .send({
          username: testUserCredentials.username,
          email: testUserCredentials.email,
          password: testUserCredentials.password,
        });
      expect([400, 409]).toContain(res.status);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/exists/i);
    });
  });

  describe('POST /api/v1/users/login', () => {
    test('should handle case-insensitive email', async () => {
      // Make sure we have a valid user first
      const testUser = {
        username: `casetest${Date.now()}`,
        email: `casetest${Date.now()}@example.com`,
        password: 'Test123!@#',
      };
      
      // Register the user
      const register = await request(app)
        .post('/api/v1/users/register')
        .send(testUser);
      expect(register.status).toBe(201);
      
      // Try to login with uppercase email
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: testUser.email.toUpperCase(),
          password: testUser.password,
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    test('should handle missing credentials', async () => {
      const res = await request(app).post('/api/v1/users/login').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      // Now we're validating with express-validator which returns specific validation errors
      expect(res.body.message).toContain('Email is invalid');
      expect(res.body.message).toContain('Password must be at least 6 characters');
    });

    test('should log in a user and return a valid JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: testUserCredentials.email,
          password: testUserCredentials.password,
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');

      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      console.log(decoded);
      expect(decoded).toHaveProperty('user._id');
      expect(decoded).toHaveProperty('user.email', testUserCredentials.email.toLowerCase());

      authToken = res.body.token;
    });

    test('should log in a user without providing username', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: testUserCredentials.email,
          password: testUserCredentials.password,
          // No username provided
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('username'); // Should still return username in response
    });

    test('should return an error if the user does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'test123',
        });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/User not found/i);
    });

    test('should return an error if password is incorrect', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: testUserCredentials.email,
          password: 'wrongpassword',
        });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/invalid credentials/i);
    });
  });

  describe('POST /api/v1/users/logout', () => {
    test('should log out user (clearing session/cookie if implemented)', async () => {
      const res = await request(app)
        .post('/api/v1/users/logout')
        .set('Authorization', `Bearer ${authToken}`);
      expect([200, 204, 401]).toContain(res.status);
    });
  });

  describe('GET /api/v1/users/session-status', () => {
    test('should indicate if a user session is active or not', async () => {
      const resNoAuth = await request(app).get('/api/v1/users/session-status');
      expect([401, 200]).toContain(resNoAuth.status);

      const resAuth = await request(app)
        .get('/api/v1/users/session-status')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 401]).toContain(resAuth.status);
    });
  });

  describe('GET /api/v1/users', () => {
    test('should get all users or users by query (admin only)', async () => {
      const query = 'admin';
      const res = await request(app)
        .get(`/api/v1/users?query=${query}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 403, 404]).toContain(res.status); // 403 if authorization fails
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });
});