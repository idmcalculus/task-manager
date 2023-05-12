const swaggerJsdoc = require('swagger-jsdoc');

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Task Manager API',
			version: '1.0.0',
			description: 'A Task Manager API built using Node.js, Express, and MongoDB',
		},
		servers: [
			{
				url: 'http://localhost:3000',
				description: 'Local development server',
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
			schemas: {
				Task: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							readOnly: true,
						},
						title: {
							type: 'string',
						},
						description: {
							type: 'string',
						},
						dueDate: {
							type: 'string',
							format: 'date-time',
						},
						completed: {
							type: 'boolean',
						},
						assignedTo: {
							type: 'string',
							description: 'The ID of the user to whom the task is assigned',
						},
					},
				},
				User: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							readOnly: true,
						},
						username: {
							type: 'string',
						},
						email: {
							type: 'string',
							format: 'email',
						},
						password: {
							type: 'string',
							format: 'password',
						},
					},
				},
				Error: {
					type: 'object',
					properties: {
						status: {
							type: 'string',
							description: 'Status of the error',
							example: 'error',
						},
						statusCode: {
							type: 'integer',
							description: 'HTTP status code',
							example: 500,
						},
						message: {
							type: 'string',
							description: 'Description of the error',
							example: 'An error occurred while processing your request.',
						},
					},
				},
			},
		},
	},
	apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
