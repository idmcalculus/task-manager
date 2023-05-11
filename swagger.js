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
			},
		},
	},
	apis: ['./routes/api/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
