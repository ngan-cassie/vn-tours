/* (main file) everthing related to express */ 
const path = require('path')
const express = require('express');
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter')
const viewRouter = require('./routes/viewRouter')

const app = express();

app.set('view engine', 'pug'); 
app.set('views', path.join(__dirname, 'views'))

// 1) GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
// Set security HTTP headers
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        'child-src': ['blob:'],
        // 'connect-src': ['https://*.mapbox.com', 'http://127.0.0.1:1801/*'],
        'default-src': ["'self'", 'http://127.0.0.1:1801/*' ],
        'font-src': ["'self'",  'https:', 'data:','https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'blob:'],
        'script-src': ["'self'", 'https://*.mapbox.com', 'https://*.stripe.com',
        'https://cdnjs.cloudflare.com/ajax/libs/axios/0.27.2/axios.min.js'],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'worker-src': ['blob:'],
        frameSrc: ["'self'", 'https://*.stripe.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: []
      }
    }
  }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}
// Limit requests from the same API
const limiter = rateLimit({
    max:100,
    windowMS: 60*60*1000,
    message: 'Too many requests from this IP, please try again in an hour'
});
app.use('/api', limiter) // apply to all routes start with api
app.use(cookieParser())

// Body parser, reading data from body into req.body
app.use(express.json({limit: '10kb'})) // for POST/PUT: asking the server to accept/ store data as a JSON object

// Data sanitization against NoSQL query injection
app.use(mongoSanitize()); 
// Data sanitization against XSS
app.use(xss()); 

// Prevent parameter pollution
app.use(hpp({
    whitelist: [
        'duration', 'ratingsQuantity','ratingsAverage','maxGroupSize','difficulty','price'
    ]
})) // clear up the query string

// Test middleware
app.use((req,res, next) => {
    console.log(req.cookies)
    next(); 
})
// 2) ROUTES
app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter)

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
})

app.use(globalErrorHandler)

module.exports = app 