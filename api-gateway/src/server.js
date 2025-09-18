require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const proxy = require('express-http-proxy');
const Redis = require('ioredis');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

const logger = require('../src/utils/logger');
const errorHandler = require('./middleware/errorHandler');
const validateToken = require('./middleware/authMiddleware');

const app = express();
const redisClient = new Redis(process.env.REDIS_URL);
const PORT = process.env.PORT || 3000;

// ENV Validation (Add more if needed)
if (!process.env.JWT_SECRET || !process.env.IDENTITY_SERVICE_URL || !process.env.POST_SERVICE_URL || !process.env.REDIS_URL) {
    logger.error('Missing one or more required environment variables.');
    process.exit(1);
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Rate Limiting with Redis
const ratelimitOptions = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.',
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});
app.use(ratelimitOptions);

//  Request Logging
app.use((req, res, next) => {
    logger.info(`Incoming Request: [${req.method}] ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
        logger.info(`Request Body: ${JSON.stringify(req.body)}`);
    }
    next();
});

// Proxy Path Rewriter and Error Handler
const proxyOptions = {
    proxyReqPathResolver: (req) => req.originalUrl.replace(/^\/v1/, '/api'),

    proxyErrorHandler: (err, req, res, next) => {
        logger.error(`Proxy error: ${err.message}`);
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`,
        });
    },
};

// Identity Service Proxy: /v1/auth → /api/auth
app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,

    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        return proxyReqOpts;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response from Identity Service: ${proxyRes.statusCode}`);
        return proxyResData;
    },
}));

//setting up proxy for our post service
app.use(
  "/v1/post",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Post service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`);
    logger.info(`Proxying to Identity Service at: ${process.env.IDENTITY_SERVICE_URL}`);
    logger.info(`Proxying to Post Service at: ${process.env.POST_SERVICE_URL}`);
    logger.info(`Connected to Redis at: ${process.env.REDIS_URL}`);
});
