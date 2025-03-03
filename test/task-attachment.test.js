const request = require('supertest');
const express = require('express');
const path = require('path');
const multer = require('multer');
const { check, validationResult } = require('express-validator');

// Create a simple express app for testing
const app = express();
app.use(express.json());

// Mock task data store
let tasks = [];
let nextId = 1;

// Mock file storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      // Instead of throwing an error, just reject the file
      cb(null, false);
    }
  }
});

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array().map(err => err.msg).join(', ') });
  }
  next();
};

// Task validation rules
const taskValidationRules = [
  check('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters'),
  
  check('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  check('attachment')
    .optional()
    .custom((value, { req }) => {
      if (!req.file) {
        return true;
      }
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
      const ext = path.extname(req.file.originalname).toLowerCase();
      return allowedExtensions.includes(ext);
    })
    .withMessage('Attachment is invalid - only jpg, jpeg, png, gif, and pdf files are allowed')
];

// Middleware to check for rejected files
const checkRejectedFile = (req, res, next) => {
  // Check if file was rejected by multer's fileFilter
  if (req.file === undefined && req.files === undefined && req.body.attachment === undefined) {
    // If there was a file in the request but it was rejected
    if (req.is('multipart/form-data')) {
      return res.status(400).json({ message: 'Attachment is invalid - only jpg, jpeg, png, gif, and pdf files are allowed' });
    }
  }
  next();
};

// Task routes
app.post('/api/tasks', upload.single('attachment'), checkRejectedFile, taskValidationRules, validateRequest, (req, res) => {
  const newTask = {
    id: nextId++,
    title: req.body.title,
    description: req.body.description || '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Add attachment if present
  if (req.file) {
    newTask.attachment = `https://mock-s3-bucket.s3.amazonaws.com/${Date.now()}-${req.file.originalname}`;
  }
  
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', upload.single('attachment'), checkRejectedFile, taskValidationRules, validateRequest, (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  const updatedTask = {
    ...tasks[taskIndex],
    title: req.body.title || tasks[taskIndex].title,
    description: req.body.description || tasks[taskIndex].description,
    updatedAt: new Date()
  };
  
  // Update attachment if present
  if (req.file) {
    updatedTask.attachment = `https://mock-s3-bucket.s3.amazonaws.com/${Date.now()}-${req.file.originalname}`;
  }
  
  tasks[taskIndex] = updatedTask;
  res.status(200).json(updatedTask);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

describe('Task Attachment Tests', () => {
  
  beforeEach(() => {
    // Reset tasks array before each test
    tasks = [];
    nextId = 1;
  });
  
  test('Should create a task with a valid attachment', async () => {
    const buffer = Buffer.from('test file content');
    
    const res = await request(app)
      .post('/api/tasks')
      .field('title', 'Task with Attachment')
      .field('description', 'This task has a file attachment')
      .attach('attachment', buffer, 'test-file.jpg');

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Task with Attachment');
    expect(res.body).toHaveProperty('attachment');
    expect(res.body.attachment).toContain('.jpg');
  });
  
  test('Should create a task without an attachment', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Task without Attachment',
        description: 'This task has no file attachment'
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Task without Attachment');
    expect(res.body).not.toHaveProperty('attachment');
  });
  
  test('Should reject task creation with an invalid file type', async () => {
    const buffer = Buffer.from('malicious content');
    
    const res = await request(app)
      .post('/api/tasks')
      .field('title', 'Task with Invalid Attachment')
      .field('description', 'This task has an invalid file attachment')
      .attach('attachment', buffer, 'malicious-file.exe');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Attachment is invalid');
  });
  
  test('Should update a task with a valid attachment', async () => {
    // First create a task
    let res = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Original Task',
        description: 'This task will be updated'
      });
    
    const taskId = res.body.id;
    
    // Then update it with an attachment
    const buffer = Buffer.from('updated file content');
    
    res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .field('title', 'Updated Task with Attachment')
      .attach('attachment', buffer, 'updated-file.png');

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Task with Attachment');
    expect(res.body).toHaveProperty('attachment');
    expect(res.body.attachment).toContain('.png');
  });
  
  test('Should reject task update with an invalid file type', async () => {
    // First create a task
    let res = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Another Original Task',
        description: 'This task will be updated with an invalid file'
      });
    
    const taskId = res.body.id;
    
    // Then try to update it with an invalid attachment
    const buffer = Buffer.from('invalid update file content');
    
    res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .field('title', 'Updated Task with Invalid Attachment')
      .attach('attachment', buffer, 'dangerous-file.bat');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Attachment is invalid');
  });
  
  test('Should handle moderately sized file uploads when creating a task', async () => {
    // Create a 100KB buffer (smaller to avoid potential payload size limits)
    const mediumBuffer = Buffer.alloc(100 * 1024, 'x');
    
    const res = await request(app)
      .post('/api/tasks')
      .field('title', 'Task with Medium Attachment')
      .field('description', 'This task has a medium-sized file attachment')
      .attach('attachment', mediumBuffer, 'medium-file.jpg');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('attachment');
  });
});
