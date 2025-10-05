require("dotenv").config()

const express = require('express')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./middleware/errorHandler')
const logger = require('./utils/logger')
const mediaRoutes = require('./routes/media-routes')
const app = express()
const PORT = process.env.PORT

//connect to mongodb
mongoose
.connect(process.env.MONGO_URI)
.then(()=>logger.info("Connect to the database"))
.catch((e)=>logger.info("Mongo connection error"))

app.use(cors())
app.use(helmet())
app.use(express.json())

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`)
  logger.info(`Request Body: ${JSON.stringify(req.body || {})}`)
  next()
})


app.use('/api/media',mediaRoutes)

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


