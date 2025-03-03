require('dotenv').config();

// Mock AWS SDK v3 and other external services
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          Location: `https://mock-s3-bucket.s3.amazonaws.com/mock-key`,
          Key: 'mock-key'
        });
      })
    })),
    PutObjectCommand: jest.fn().mockImplementation((params) => params),
    DeleteObjectCommand: jest.fn().mockImplementation((params) => params)
  };
});

// Mock environment variables for testing
process.env.AWS_S3_BUCKET = 'mock-s3-bucket';
process.env.AWS_ACCESS_KEY_ID = 'mock-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'mock-secret-key';
process.env.AWS_REGION = 'us-east-1';

// Global setup
beforeAll(async () => {
  // Add any global setup here
});

// Global teardown
afterAll(async () => {
  // Add any global teardown here
});
