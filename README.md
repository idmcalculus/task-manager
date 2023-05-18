# Task Manager API

This is a simple Task Manager API built with Node.js, Express, and MongoDB. The API allows users to create, update, delete, and retrieve tasks, as well as register and log in. It also provides email notifications for task assignment and completion, supports file attachments, and implements user authentication and authorization using JWT.

## Features

- RESTful API endpoints for tasks and user management
- User registration and login with JWT authentication
- CRUD operations for tasks
- Assign tasks to different users
- Email notifications for task assignment and completion
- File attachments for tasks
- Input validation and data sanitization
- CORS policy and rate limiting
- API documentation using Swagger OpenAPI 3.0

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or remote)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/task-manager-api.git
```

2. Change to the project directory:

```bash
cd task-manager-api
```

3. Install the dependencies:

```bash
npm install
```

4. Create a `.env` file in the project root and set the environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file and replace the placeholders with your actual configurations.


5. Start the development server:

```bash
npm run dev
```

The API should now be running at `http://localhost:8008`.

## API Documentation

You can find the API documentation at `http://localhost:8008/api-docs`.

## Running Tests

To run the tests, execute the following command:

```bash
npm test
```

## License

This project is licensed under the MIT License.
