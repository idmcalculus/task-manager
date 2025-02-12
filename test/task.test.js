const chai = require('chai');
const { expect } = chai;
const chaiHttp = require('chai-http');
const { request } = chaiHttp;
const app = require('../index');
const Task = require('../models/Task');
const User = require('../models/User');

chai.use(chaiHttp);

let authToken;
let testUser;
let testTask;

describe('Task API', () => {
  // Before running tests, create a test user and get auth token
  before(async () => {
    // Clean up existing data
    await Task.deleteMany({});
    await User.deleteMany({});

    // Register a test user
    const newUser = {
      username: `testuser${Date.now()}`,
      email: `testuser${Date.now()}@example.com`,
      password: 'Test123!@#',
      isAdmin: true
    };

    const registerRes = await chai
      .request(app)
      .post('/v1/users/register')
      .send(newUser);

    testUser = registerRes.body;

    // Login to get auth token
    const loginRes = await chai
      .request(app)
      .post('/v1/users/login')
      .send({
        email: newUser.email,
        password: newUser.password
      });

    authToken = loginRes.body.token;

    // Create another user for assignment testing
    const assignedUser = {
      username: `assigneduser${Date.now()}`,
      email: `assigneduser${Date.now()}@example.com`,
      password: 'Test123!@#'
    };

    const assignedUserRes = await chai
      .request(app)
      .post('/v1/users/register')
      .send(assignedUser);

    testUser.assignedUserId = assignedUserRes.body._id;
  });

  describe('POST /tasks', () => {
    it('should require authentication', (done) => {
      const newTask = {
        title: 'Test Task',
        description: 'This is a test task',
        dueDate: '2025-12-31',
        priority: 'high',
        status: 'todo'
      };

      chai
        .request(app)
        .post('/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTask)
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('token');
          done();
        });
    });
    it('should create a new task with all fields', (done) => {
      const newTask = {
        title: 'Test Task',
        description: 'This is a test task',
        dueDate: '2025-12-31',
        priority: 'high',
        status: 'todo'
      };

      chai
        .request(app)
        .post('/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTask)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('title', newTask.title);
          expect(res.body).to.have.property('description', newTask.description);
          testTask = res.body;
          done();
        });
    });

    it('should return error if required fields are missing', (done) => {
      const invalidTask = {
        description: 'This is a test task'
      };

      chai
        .request(app)
        .post('/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTask)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          done();
        });
    });

    it('should return error if date format is invalid', (done) => {
      const invalidTask = {
        title: 'Test Task',
        description: 'This is a test task',
        dueDate: 'invalid-date',
        priority: 'high',
        status: 'todo'
      };

      chai
        .request(app)
        .post('/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTask)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });

  describe('GET /tasks', () => {
    it('should require authentication', (done) => {
      chai
        .request(app)
        .get('/v1/tasks')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('token');
          done();
        });
    });

    it('should handle invalid page numbers', (done) => {
      chai
        .request(app)
        .get('/v1/tasks?page=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          done();
        });
    });
    it('should get all tasks with pagination', (done) => {
      chai
        .request(app)
        .get('/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('tasks').to.be.an('array');
          expect(res.body).to.have.property('currentPage');
          expect(res.body).to.have.property('totalPages');
          done();
        });
    });

    it('should filter tasks by search query', (done) => {
      chai
        .request(app)
        .get('/v1/tasks?search=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body.tasks).to.be.an('array');
          res.body.tasks.forEach(task => {
            expect(task.title.toLowerCase()).to.include('test');
          });
          done();
        });
    });

    it('should filter tasks by status', (done) => {
      chai
        .request(app)
        .get('/v1/tasks?status=todo')
        .set('Authorization', `Bearer ${authToken}`)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body.tasks).to.be.an('array');
          res.body.tasks.forEach(task => {
            expect(task.status).to.equal('todo');
          });
          done();
        });
    });
  });

  describe('GET /tasks/:id', () => {
    it('should get a task by id', (done) => {
      chai
        .request(app)
        .get(`/v1/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('_id', testTask._id);
          expect(res.body).to.have.property('title', testTask.title);
          done();
        });
    });

    it('should return 404 for non-existent task', (done) => {
      chai
        .request(app)
        .get('/v1/tasks/5f7d7e9b9b9b9b9b9b9b9b9b')
        .set('Authorization', `Bearer ${authToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should require authentication', (done) => {
      chai
        .request(app)
        .put(`/v1/tasks/${testTask._id}`)
        .send({ title: 'Updated Title' })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('token');
          done();
        });
    });

    it('should validate task assignment', (done) => {
      chai
        .request(app)
        .put(`/v1/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assignedTo: 'invalid-user-id'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('Invalid user');
          done();
        });
    });

    it('should successfully assign task to user', (done) => {
      chai
        .request(app)
        .put(`/v1/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assignedTo: testUser.assignedUserId
        })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('assignedTo', testUser.assignedUserId);
          done();
        });
    });
    it('should update a task', (done) => {
      const updateData = {
        title: 'Updated Test Task',
        status: 'in-progress'
      };

      chai
        .request(app)
        .put(`/v1/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('title', updateData.title);
          expect(res.body).to.have.property('status', updateData.status);
          done();
        });
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should require authentication', (done) => {
      chai
        .request(app)
        .delete(`/v1/tasks/${testTask._id}`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('token');
          done();
        });
    });

    it('should return 404 for non-existent task', (done) => {
      chai
        .request(app)
        .delete('/v1/tasks/5f7d7e9b9b9b9b9b9b9b9b9b')
        .set('Authorization', `Bearer ${authToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('not found');
          done();
        });
    });
    it('should delete a task', (done) => {
      chai
        .request(app)
        .delete(`/v1/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });
  });

  // Clean up after tests
  after(async () => {
    await Task.deleteMany({});
    await User.deleteMany({});
  });
});
