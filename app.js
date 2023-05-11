require('dotenv').config();
const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');
const connectToDatabase = require('./database/connection');

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Connect to the MongoDB database
connectToDatabase()
.then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      	console.log(`Server is running on port ${port}`);
    });
})
.catch((err) => {
	console.error('Failed to connect to MongoDB', err);
});
