const path = require('path');

// Mock S3Client for multer-s3
const mockS3Client = {
  send: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      Location: `https://mock-s3-bucket.s3.amazonaws.com/mock-key`,
      Key: 'mock-key'
    });
  })
};

// Mock multerS3 storage
const mockMulterS3Storage = () => {
  return {
    _handleFile: (req, file, cb) => {
      // Generate a mock key for the file
      const filename = file.originalname.replace(/\s+/g, '-').toLowerCase();
      const key = `${Date.now()}-${filename}`;
      const location = `https://mock-s3-bucket.s3.amazonaws.com/${key}`;
      
      // Create a mock S3 file object
      const s3File = {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: getMimeType(file.originalname),
        size: file.buffer ? file.buffer.length : 0,
        bucket: 'mock-s3-bucket',
        key: key,
        location: location
      };
      
      // Set the attachment in the request body
      req.body = req.body || {};
      req.body.attachment = location;
      
      // Return the mock file
      cb(null, s3File);
    },
    _removeFile: (req, file, cb) => {
      cb(null);
    }
  };
};

// Mock implementation of multer for testing
const upload = {
  single: (fieldName) => {
    return (req, res, next) => {
      // If there's no file, just continue
      if (!req.file) {
        return next();
      }
      
      // Process the file with our mock storage
      const storage = mockMulterS3Storage();
      storage._handleFile(req, req.file, (err, info) => {
        if (err) return next(err);
        
        // Replace the file with the processed one
        req.file = info;
        next();
      });
    };
  }
};

// Helper to determine mimetype based on file extension
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.exe': 'application/octet-stream',
    '.bat': 'application/x-bat',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = { upload, s3Client: mockS3Client };
