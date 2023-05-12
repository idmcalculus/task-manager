exports.welcomeHTML = () => {
	return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }
                h1 {
                    font-size: 48px;
                }
                a {
                    text-decoration: none;
                    color: #007bff;
                }
                p {
                    margin: 20px auto;
                    text-align: center;
                    max-width: 800px;
                    color: #3E3E40;
                    font-size: 18px;
                    font-weight: 500;
                }
            </style>
        </head>
        <body>
            <div>
                <h1>Welcome to Task Manager API</h1>
                <p>
                    This is a simple Task Manager API built with Node.js, Express, and MongoDB.
                    The API allows users to create, update, delete, and retrieve tasks, as well as register and log in.
                    It also provides email notifications for task assignment and completion, supports file attachments,
                    and implements user authentication and authorization using JWT.
                </p>
                <p>Check out the <a href="/api-docs">API documentation</a></p>
                <p>Find the project source code on <a href="https://github.com/idmcalculus/task-manager-api" target="_blank" rel="noopener noreferrer">GitHub</a></p>
            </div>
        </body>
    </html>
	`
}