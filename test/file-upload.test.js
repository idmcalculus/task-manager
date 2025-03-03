const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Import validation middleware
const { check, validationResult } = require('express-validator');

// Create a simple express app for testing
const app = express();
app.use(express.json());

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
      // and let the validation middleware handle it
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

// File upload validation
const fileValidationRules = [
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

// Test routes
app.post('/upload', upload.single('attachment'), (req, res, next) => {
  // Check if file was rejected by multer's fileFilter
  if (req.file === undefined && req.files === undefined && req.body.attachment === undefined) {
    // If there was a file in the request but it was rejected
    if (req.is('multipart/form-data')) {
      return res.status(400).json({ message: 'Attachment is invalid - only jpg, jpeg, png, gif, and pdf files are allowed' });
    }
  }
  next();
}, fileValidationRules, validateRequest, (req, res) => {
  if (req.file) {
    return res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path || 'memory storage'
      }
    });
  }
  res.status(400).json({ message: 'No file uploaded' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

describe('File Upload Tests', () => {
  
  test('Should successfully upload a valid attachment', async () => {
    // Create a buffer with test content
    const buffer = Buffer.from('test file content');
    
    const res = await request(app)
      .post('/upload')
      .attach('attachment', buffer, 'test-file.jpg');

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('File uploaded successfully');
    expect(res.body.file.originalname).toBe('test-file.jpg');
  });

  test('Should upload a PNG file successfully', async () => {
    const buffer = Buffer.from('PNG test content');
    
    const res = await request(app)
      .post('/upload')
      .attach('attachment', buffer, 'test-image.png');

    expect(res.status).toBe(201);
    expect(res.body.file.originalname).toBe('test-image.png');
  });

  test('Should upload a PDF file successfully', async () => {
    const buffer = Buffer.from('PDF test content');
    
    const res = await request(app)
      .post('/upload')
      .attach('attachment', buffer, 'document.pdf');

    expect(res.status).toBe(201);
    expect(res.body.file.originalname).toBe('document.pdf');
  });

  test('Should reject an invalid file type', async () => {
    const buffer = Buffer.from('malicious content');
    
    const res = await request(app)
      .post('/upload')
      .attach('attachment', buffer, 'malicious-file.exe');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Attachment is invalid');
  });

  test('Should reject another invalid file type', async () => {
    const buffer = Buffer.from('script content');
    
    const res = await request(app)
      .post('/upload')
      .attach('attachment', buffer, 'script.bat');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Attachment is invalid');
  });

  test('Should handle large file uploads', async () => {
    // Create a 1MB buffer
    const largeBuffer = Buffer.alloc(1 * 1024 * 1024, 'x');
    
    const res = await request(app)
      .post('/upload')
      .attach('attachment', largeBuffer, 'large-file.jpg');

    expect(res.status).toBe(201);
    expect(res.body.file.size).toBe(1 * 1024 * 1024);
  });
});
