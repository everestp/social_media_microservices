require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const helmet = require('helmet')
const cors = require('cors')
const Redis = require('ioredis')
const { RateLimiterRedis } = require('rate-limiter-flexible')
const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')

const routes = require('./routes/identity-service')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3001

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info("Connected to MongoDB"))
  .catch(e => logger.error("MongoDB connection error", e))

const redisClient = new Redis(process.env.REDIS_URL)

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`)
  logger.info(`Request Body: ${JSON.stringify(req.body || {})}`)
  next()
})

// Global Rate Limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10, // 10 requests
  duration: 1 // per 1 second
})

app.use((req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => next())
    .catch((err) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`)
      res.status(429).json({
        success: false,
        message: 'Too many requests'
      })
    })
})

// Sensitive Endpoint Rate Limiting
const sensitiveEndPointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({
      success: false,
      message: 'Too many requests'
    })
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args)
  })
})

// Apply sensitive limiter to /register
app.use('/api/auth/register', sensitiveEndPointsLimiter)

// Routes
app.use('/api/auth', routes)

// Error handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  logger.info(`Identity service is running at port ${PORT}`)
})

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason)
})
