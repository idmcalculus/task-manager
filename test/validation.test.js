
const { taskValidationRules, userValidationRules } = require('../utils/validation');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const path = require('path');

// Helper function to run validation rules
const runValidation = async (rules, body, file = null) => {
    const req = {
        body,
        file
    };
    await Promise.all(rules.map(validation => validation.run(req)));
    return validationResult(req);
};

describe('Validation Rules', () => {
    describe('Task Validation Rules', () => {
        it('should validate a valid task', async () => {
            const validTask = {
                title: 'Test Task',
                description: 'Test Description',
                status: 'In Progress',
                assignedTo: new mongoose.Types.ObjectId().toString(),
                dueDate: '2025-12-31',
                priority: 'Medium',
                createdBy: new mongoose.Types.ObjectId().toString()
            };
            
            const result = await runValidation(taskValidationRules, validTask);
            expect(result.isEmpty()).toBe(true);
        });

        it('should reject empty title', async () => {
            const taskWithoutTitle = {
                description: 'Test Description',
                createdBy: new mongoose.Types.ObjectId().toString()
            };
            
            const result = await runValidation(taskValidationRules, taskWithoutTitle);
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Title is required');
        });

        it('should validate optional fields', async () => {
            const taskWithOptionalFields = {
                title: 'Test Task',
                createdBy: new mongoose.Types.ObjectId().toString()
            };
            
            const result = await runValidation(taskValidationRules, taskWithOptionalFields);
            expect(result.isEmpty()).toBe(true);
        });

        it('should reject invalid priority', async () => {
            const taskWithInvalidPriority = {
                title: 'Test Task',
                priority: 'Invalid',
                createdBy: new mongoose.Types.ObjectId().toString()
            };
            
            const result = await runValidation(taskValidationRules, taskWithInvalidPriority);
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Priority is invalid');
        });

        it('should reject invalid assignedTo ID', async () => {
            const taskWithInvalidAssignedTo = {
                title: 'Test Task',
                assignedTo: 'invalid-id',
                createdBy: new mongoose.Types.ObjectId().toString()
            };
            
            const result = await runValidation(taskValidationRules, taskWithInvalidAssignedTo);
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Assigned user ID is invalid');
        });

        it('should validate attachment with valid extension', async () => {
            const validTask = {
                title: 'Test Task',
                createdBy: new mongoose.Types.ObjectId().toString(),
                attachment: 'test.jpg'
            };
            
            // Test each allowed extension
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
            for (const ext of allowedExtensions) {
                const file = {
                    originalname: `test${ext}`
                };
                
                const result = await runValidation(taskValidationRules, validTask, file);
                expect(result.isEmpty()).toBe(true);
            }
        });

        it('should handle case-insensitive file extensions', async () => {
            const validTask = {
                title: 'Test Task',
                createdBy: new mongoose.Types.ObjectId().toString(),
                attachment: 'test.JPG'
            };
            
            const file = {
                originalname: 'test.JPG'
            };
            
            const result = await runValidation(taskValidationRules, validTask, file);
            expect(result.isEmpty()).toBe(true);
        });

        it('should reject attachment with invalid extension', async () => {
            const validTask = {
                title: 'Test Task',
                createdBy: new mongoose.Types.ObjectId().toString(),
                attachment: 'test.exe'
            };
            
            const invalidExtensions = ['.exe', '.pdf', '.doc', '.zip'];
            for (const ext of invalidExtensions) {
                const file = {
                    originalname: `test${ext}`
                };
                
                const result = await runValidation(taskValidationRules, validTask, file);
                expect(result.isEmpty()).toBe(false);
                expect(result.array()[0].msg).toBe('Attachment is invalid');
            }
        });

        it('should handle missing file when attachment field is present', async () => {
            const validTask = {
                title: 'Test Task',
                createdBy: new mongoose.Types.ObjectId().toString(),
                attachment: 'some-value'
            };
            
            const result = await runValidation(taskValidationRules, validTask);
            expect(result.isEmpty()).toBe(true);
        });

        it('should handle no file and no attachment field', async () => {
            const validTask = {
                title: 'Test Task',
                createdBy: new mongoose.Types.ObjectId().toString()
            };
            
            const result = await runValidation(taskValidationRules, validTask);
            expect(result.isEmpty()).toBe(true);
        });
    });

    describe('User Validation Rules', () => {
        it('should validate a valid user', async () => {
            const validUser = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123!'
            };
            
            const result = await runValidation(userValidationRules, validUser);
            expect(result.isEmpty()).toBe(true);
        });

        it('should reject empty username', async () => {
            const userWithoutUsername = {
                email: 'test@example.com',
                password: 'Password123!'
            };
            
            const result = await runValidation(userValidationRules, userWithoutUsername);
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Username is required');
        });

        it('should reject invalid email', async () => {
            const userWithInvalidEmail = {
                username: 'testuser',
                email: 'invalid-email',
                password: 'Password123!'
            };
            
            const result = await runValidation(userValidationRules, userWithInvalidEmail);
            expect(result.isEmpty()).toBe(false);
            expect(result.array().some(error => error.param === 'email')).toBe(true);
        });

        it('should reject weak password', async () => {
            const userWithWeakPassword = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'weak'
            };
            
            const result = await runValidation(userValidationRules, userWithWeakPassword);
            expect(result.isEmpty()).toBe(false);
            expect(result.array().some(error => error.param === 'password')).toBe(true);
        });
    });
});
