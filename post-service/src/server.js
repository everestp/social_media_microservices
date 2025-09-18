
require("dotenv").config()

const express = require('express')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const cors = require('cors')
const helmet = require('helmet')
const postRoutes = require('./routes/post-routes')
const errorHandler = require('./middleware/errorHandler')
const logger = require('./utils/logger')

const app = express()
const PORT = process.env.PORT || 3002

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


// **** Homework- Implement Ip based rate Limiting for sensetive endpoints

//routes -> pass redis client
app.use(
  "/api/post",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);




// Error handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  logger.info(`Post service is running at port ${PORT}`)
})

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason)
})



