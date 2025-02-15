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
                    margin: 0;
                    padding: 0;
                    background-color: #ddd;
                }

                div.welcome_msg_container {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    max-width: 800px;
                    height: 100vh;
                    font-family: Arial, sans-serif;
                }

                h1 {
                    font-size: 48px;
                }

                div.content {
                    margin: 0 auto;
                }

                a {
                    text-decoration: none;
                    color: #007bff;
                }

                p {
                    text-align: center;
                    color: #3E3E40;
                    font-size: 24px;
                    font-weight: 500;
                    line-height: 1.75;
                    padding: 20px;
                }
            </style>
        </head>
        <body>
            <div class="welcome_msg_container">
                <h1>Welcome to Task Manager API</h1>
                <div class="content">
                    <p>
                        This is a simple Task Manager API built with Node.js, Express, and MongoDB.
                        The API allows users to create, update, delete, and retrieve tasks, as well as register and log in.
                        It also provides email notifications for task assignment and completion, supports file attachments,
                        and implements user authentication and authorization using JWT.
                    </p>
                    <p>Check out the <a href="/api/docs">API documentation</a></p>
                    <p>Find the project source code on <a href="https://github.com/idmcalculus/task-manager-api" target="_blank" rel="noopener noreferrer">GitHub</a></p>
                </div>
            </div>
        </body>
    </html>
	`
}