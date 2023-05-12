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
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        font-family: Arial, sans-serif;
                    }
                    h1 {
                        font-size: 48px;
                    }
                    a {
                        text-decoration: none;
                        color: #007bff;
                    }
                </style>
            </head>
            <body>
                <div>
                    <h1>Welcome to Task Manager API</h1>
                    <p>Check out the <a href="/api-docs">API documentation</a></p>
                </div>
            </body>
        </html>
	`
}