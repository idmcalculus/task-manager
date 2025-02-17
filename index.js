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
const path = require('path');

// Import routes
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');

const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
});

const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

const allowedDomains = [process.env.LOCAL_URL, process.env.BUILD_URL, process.env.PROD_URL];

app.use(express.json());
app.set('trust proxy', 1);
app.use(cors({
    origin: function(origin, callback){
        if(allowedDomains.indexOf(origin) !== -1 || !origin){
            return callback(null, true);
        } else {
            return callback(new Error('CORS not allowed'), false);
        }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,POST,DELETE",
}));

app.use(morgan('dev'));
app.use(session({
    name: 'sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    },
    rolling: true,
}));

// Apply rate limiter to all API routes
app.use('/api/v1/', apiRateLimiter);

// app.use(shouldSendSameSiteNone);
app.use(express.static('build'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { customCssUrl: CSS_URL }));

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', taskRoutes);

// error handler middleware
app.use(handleError);

app.get('/api', (req, res) => {
    res.send(welcomeHTML());
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

// Connect to MongoDB for both direct run and tests
connectToDatabase()
.then(() => {
    // Only start the server if this file is run directly
    if (require.main === module) {
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }
})
.catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});

module.exports = app;
