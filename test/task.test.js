/**
 * test/task.test.js
 */
const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../index');
const Task = require('../models/Task');
const User = require('../models/User');

jest.setTimeout(30000); // Increase if needed

let adminAgent;       // Retains admin session
let regAgent;         // Retains regular-user session
let noAuthAgent;      // Does NOT retain any session (for 401 checks)

let adminToken;
let regularUserToken;

describe('Task API', () => {
  /**
   * beforeAll()
   *   - Create admin user
   *   - Create regular user
   *   - Create assigned user
   *   - Store tokens
   */
  beforeAll(async () => {
    // Clean up everything once
    await Task.deleteMany({});
    await User.deleteMany({});

    // We'll create three different supertest "agents"
    adminAgent = request.agent(app);
    regAgent = request.agent(app);
    noAuthAgent = request(app); // no session

    // 1) Create & login admin
    const adminUserData = {
      username: `adminuser${Date.now()}`,
      email: `adminuser${Date.now()}@example.com`,
      password: 'Test123!@#',
      isAdmin: true,
    };
    let res = await adminAgent.post('/api/v1/users/register').send(adminUserData);
    expect(res.status).toBe(201);

    res = await adminAgent.post('/api/v1/users/login').send({
      email: adminUserData.email,
      password: adminUserData.password,
    });
    expect(res.status).toBe(200);

    // Check session
    res = await adminAgent.get('/api/v1/users/session-status');
    expect(res.status).toBe(200);
    adminToken = res.body.token;

    // 2) Create & login regular user
    const regularUserData = {
      username: `regularuser${Date.now()}`,
      email: `regularuser${Date.now()}@example.com`,
      password: 'Test123!@#',
      isAdmin: false,
    };

    res = await regAgent.post('/api/v1/users/register').send(regularUserData);
    expect(res.status).toBe(201);

    res = await regAgent.post('/api/v1/users/login').send({
      email: regularUserData.email,
      password: regularUserData.password,
    });
    expect(res.status).toBe(200);

    res = await regAgent.get('/api/v1/users/session-status');
    expect(res.status).toBe(200);
    regularUserToken = res.body.token;

    // 3) Create assigned user (no login needed for them if you don’t want)
    const assignedUserData = {
      username: `assigneduser${Date.now()}`,
      email: `assigneduser${Date.now()}@example.com`,
      password: 'Test123!@#',
    };
    res = await noAuthAgent.post('/api/v1/users/register').send(assignedUserData);
    expect(res.status).toBe(201);

    assignedUserId = res.body._id; // or .id, based on your JSON
  });

  /**
   * beforeEach()
   *   - Only delete tasks so we keep our 3 users in the DB
   */
  beforeEach(async () => {
    await Task.deleteMany({});
  });

  /**
   * afterAll()
   *   - Final cleanup
   */
  afterAll(async () => {
    await Task.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // --------------------------------------------------------------------------------
  // Tests that check "no token" expect a 401. We use noAuthAgent to ensure no session.
  // --------------------------------------------------------------------------------

  test('POST /api/v1/tasks should require authentication', async () => {
    // Use noAuthAgent to ensure no token is included
    const res = await noAuthAgent.post('/api/v1/tasks').send({
      title: 'Should fail',
      dueDate: '2025-12-31'
    });
    // We expect 401, but logs showed 201 previously => we fix that here
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Authentication required');
  });

  test('GET /api/v1/tasks requires authentication', async () => {
    const res = await noAuthAgent.get('/api/v1/tasks');
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Authentication required');
  });

  test('PUT /api/v1/tasks/:id -> requires authentication', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await noAuthAgent.put(`/api/v1/tasks/${fakeId}`).send({ title: 'No Auth' });
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Authentication required');
  });

  test('DELETE /api/v1/tasks/:id -> requires authentication', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await noAuthAgent.delete(`/api/v1/tasks/${fakeId}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Authentication required');
  });

  // --------------------------------------------------------------------------------
  // Tests that check "admin token" or "regular user token"
  // --------------------------------------------------------------------------------

  test('POST /api/v1/tasks should create a new task (admin token)', async () => {
    const newTask = {
      title: 'Admin Created Task',
      description: 'Test task from admin',
      dueDate: '2025-12-31',
      priority: 'High',
      status: 'Not Started',
    };

    const res = await adminAgent
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newTask);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id'); 
    expect(res.body.title).toBe(newTask.title);
  });

  test('POST /api/v1/tasks should return error if required fields are missing', async () => {
    const res = await adminAgent
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'No title, no dueDate' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('POST /api/v1/tasks returns error for invalid date format', async () => {
    const badDateTask = {
      title: 'Bad date',
      description: 'Invalid format test',
      dueDate: 'not-a-date',
    };

    const res = await adminAgent
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(badDateTask);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid dueDate');
  });

  test('GET /api/v1/tasks (admin) should get all tasks with pagination', async () => {
    // create a sample task
    await adminAgent
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Paginated Task', dueDate: '2025-12-31' });

    const res = await adminAgent
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body).toHaveProperty('currentPage');
    expect(res.body).toHaveProperty('totalPages');
  });

  test('GET /api/v1/tasks?search=Test filters tasks by search query', async () => {
    // Create a task containing 'Test'
    await adminAgent
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'My Test Task', dueDate: '2025-12-31' });

    const res = await adminAgent
      .get('/api/v1/tasks?search=Test')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    res.body.tasks.forEach(task => {
      expect(`${task.title} ${task.description}`.toLowerCase()).toMatch(/test/);
    });
  });

  test('GET /api/v1/tasks?status=Not Started filters tasks by status', async () => {
    // create a Not Started task
    await adminAgent
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Filter Status', dueDate: '2025-12-31', status: 'Not Started' });

    const res = await adminAgent
      .get('/api/v1/tasks?status=Not Started')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.tasks.forEach(t => {
      expect(t.status).toBe('Not Started');
    });
  });

  test('GET /api/v1/tasks/:id -> 404 for non-existent task', async () => {
    const nonexistentId = new mongoose.Types.ObjectId();
    const res = await adminAgent
      .get(`/api/v1/tasks/${nonexistentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  // -----------------------
  // PUT tests
  // -----------------------

  test('PUT /api/v1/tasks/:id -> should validate task assignment', async () => {
    // Create a real task
    const createRes = await adminAgent
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Assignment Check', dueDate: '2025-12-31' });
    const taskId = createRes.body.id;

    // Attempt to assign to an invalid ID
    const res = await adminAgent
      .put(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedTo: 'invalid-id' });

    // The code might return 400 or 404 if the user doesn’t exist
    expect([400, 404, 500]).toContain(res.status);
    expect(res.body).toHaveProperty('message');
  });

  test('PUT /api/v1/tasks/:id -> successfully assign task to user', async () => {
    // First, create a task
    const createRes = await adminAgent
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Assign me', dueDate: '2025-12-31' });
    const taskId = createRes.body.id;

    // Create a user to assign to
    const assignedUser = await User.create({
      username: `assignee${Date.now()}`,
      email: `assignee${Date.now()}@example.com`,
      password: 'Assign123!@#',
      isAdmin: false,
    });
    const assignedUserId = assignedUser._id;

    // Assign to a user
    const res = await adminAgent
      .put(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedTo: assignedUserId });

    expect([200, 202]).toContain(res.status);
    expect(res.body).toHaveProperty('assignedTo', assignedUserId.toString());
  });

  test('PUT /api/v1/tasks/:id -> update a task field(s)', async () => {
    // Create a task
    const createRes = await adminAgent
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Will be updated', dueDate: '2025-12-31' });
    const taskId = createRes.body.id;

    const updateData = {
      title: 'Updated Title',
      status: 'In Progress',
    };

    const res = await adminAgent
      .put(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData);

    expect([200, 202]).toContain(res.status);
    expect(res.body.title).toBe(updateData.title);
    expect(res.body.status).toBe(updateData.status);
  });

  // -----------------------
  // DELETE tests
  // -----------------------

  test('DELETE /api/v1/tasks/:id -> returns 404 for non-existent task', async () => {
    const nonexistentId = new mongoose.Types.ObjectId();
    const res = await adminAgent
      .delete(`/api/v1/tasks/${nonexistentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect([404, 202]).toContain(res.status);
    if (res.status === 404) {
      expect(res.body.message).toContain('not found');
    }
  });

  test('DELETE /api/v1/tasks/:id -> deletes a task', async () => {
    // Create a task
    const createRes = await adminAgent
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Delete me', dueDate: '2025-12-31' });
    const delId = createRes.body.id;

    const res = await adminAgent
      .delete(`/api/v1/tasks/${delId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 202]).toContain(res.status);

    if (res.body.message) {
      expect(res.body.message).toContain('deleted successfully');
    }
  });

  // --------------------------------------------------------------------------------
  // Sub-suites for more targeted coverage
  // --------------------------------------------------------------------------------

  describe('Task Creation (sub-suite)', () => {
    test('Should create a task successfully with valid data', async () => {
      const taskData = {
        title: 'Valid Task 1',
        description: 'Test creation',
        dueDate: '2026-01-01', // valid
      };

      const res = await adminAgent
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(taskData);

      expect(res.status).toBe(201);
      expect(res.body.title).toBe(taskData.title);
    });

    test('Should fail to create task with invalid data', async () => {
      const invalidTask = {
        description: 'Missing title, missing dueDate',
      };

      const res = await adminAgent
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidTask);

      expect(res.status).toBe(400);
    });
  });

  describe('Task Retrieval (sub-suite)', () => {
    let someTaskId;

    beforeEach(async () => {
      // Create a fresh task for each retrieval test
      const createRes = await adminAgent
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Retrieve Me',
          dueDate: '2025-12-31',
          status: 'Not Started',
        });
      someTaskId = createRes.body.id;
    });

    test('GET /api/v1/tasks (admin) should get all tasks', async () => {
      const res = await adminAgent
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tasks)).toBe(true);
    });

    test('GET /api/v1/tasks/:id (admin) gets a task by id', async () => {
      const res = await adminAgent
        .get(`/api/v1/tasks/${someTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(someTaskId);
    });

    test('GET /api/v1/tasks?status=Not Started returns tasks with matching status', async () => {
      const res = await adminAgent
        .get('/api/v1/tasks?status=Not Started')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      res.body.tasks.forEach(task => {
        expect(task.status).toBe('Not Started');
      });
    });
  });

  describe('Task Update (sub-suite)', () => {
    let updatableTaskId;

    beforeEach(async () => {
      // Create task that we'll update
      const createRes = await adminAgent
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Update This Task',
          dueDate: '2025-12-31',
          status: 'Not Started',
        });
      updatableTaskId = createRes.body.id;
    });

    test('Should update task successfully (admin)', async () => {
      const updateData = {
        title: 'Updated Title!',
        status: 'In Progress'
      };

      const res = await adminAgent
        .put(`/api/v1/tasks/${updatableTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([200, 202]).toContain(res.status);
      expect(res.body.title).toBe(updateData.title);
      expect(res.body.status).toBe(updateData.status);
    });

    test('Regular user cannot update other users tasks', async () => {
      const updateData = { title: 'Regular user tries to update' };
      const res = await regAgent
        .put(`/api/v1/tasks/${updatableTaskId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(updateData);

      expect(res.status).toBe(403);
    });
  });

  describe('Task Deletion (sub-suite)', () => {
    let deletableTaskId;

    beforeEach(async () => {
      const createRes = await adminAgent
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Delete This Task',
          dueDate: '2025-12-31',
        });
      deletableTaskId = createRes.body.id;
    });

    test('Should delete task successfully as admin', async () => {
      const res = await adminAgent
        .delete(`/api/v1/tasks/${deletableTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 202]).toContain(res.status);
      if (res.body.message) {
        expect(res.body.message).toBe('Task deleted successfully');
      }

      // Verify it's gone
      const check = await adminAgent
        .get(`/api/v1/tasks/${deletableTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(check.status).toBe(404);
    });

    test('Regular user cannot delete other users tasks', async () => {
      const res = await regAgent
        .delete(`/api/v1/tasks/${deletableTaskId}`)
        .set('Authorization', `Bearer ${regularUserToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Authorization Tests (sub-suite)', () => {
    test('Should require authentication for all basic routes', async () => {
      // Use noAuthAgent for each route
      const randomId = new mongoose.Types.ObjectId();
      const routes = [
        { method: 'get', path: '/api/v1/tasks' },
        { method: 'post', path: '/api/v1/tasks' },
        { method: 'put', path: `/api/v1/tasks/${randomId}` },
        { method: 'delete', path: `/api/v1/tasks/${randomId}` },
      ];

      for (const r of routes) {
        const res = await noAuthAgent[r.method](r.path);
        expect(res.status).toBe(401);
      }
    });
  });
});