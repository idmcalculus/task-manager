require('dotenv').config();
const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const swaggerDocument = require('./swagger');
const connectToDatabase = require('./database/connection');
const { handleError } = require('./middleware/errorHandler');
const { welcomeHTML } = require('./utils/welcomeHTML');

// Import routes
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');

const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
});

const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { customCssUrl: CSS_URL }));
app.use(morgan('dev'));
app.use(session({
    name: 'sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: true,
    }
}));

// Apply rate limiter to all API routes
app.use('/v1/', apiRateLimiter);

// Routes
app.use('/v1/users', userRoutes);
app.use('/v1', taskRoutes);

// error handler middleware
app.use(handleError);

app.get('/', (req, res) => {
    res.send(welcomeHTML());
});

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

module.exports = app;
