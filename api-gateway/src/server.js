

require('dotenv').config()

const express = require('express')
const cors = require('cors')
 const helmet = require('helmet')
 const logger = require('../src/utils/logger')
 const proxy = require('express-http-proxy')  //THis is awesome package read about it
 const { error } = require('winston')
 const errorHandler = require('./middleware/errorHandler')
 const Redis = require('ioredis')
 const {rateLimit}= require('express-rate-limit')
 const {RedisStore}=require('rate-limit-redis')
 
 
 
 
 
 const app =express()
 const redisClient = new Redis(process.env.REDIS_URL)
const PORT=process.env.PORT || 3000;


app.use(helmet())
app.use(cors())
app.use(express.json())

//  Rate Limiting
 const ratelimit = rateLimit({
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

app.use(ratelimit)
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`)
  logger.info(`Request Body: ${JSON.stringify(req.body || {})}`)
  next()
})









//Remmember this concept rest of life
/*
api-gateway->     /v1/auth/register -> this should  taget to identity service 3000
identiy-service -> api/auth/register ->Port ->3001

final api localhost:3000/v1/auth/register -> should redirevt adn hit to -> localhost:3001/api/auth/register
 */



const proxyOptions = {
    proxyReqPathResolver :(req)=>{
        return req.originalUrl.replace(/^\v1/,"/api")
    },
    proxyErrorHandler :(err ,res ,next)=>{
        logger.error(`Proxy error :${err.message}`),
        res.status(500).json({
            message :`Internal Server Error error : ${err.message}`
        })
    }

}


//setting up proxy for out identiy service -> VVVVVI VVVI Important understand  it
app.use('/v1/auth',proxy(process.env.IDENTITY_SERVICE_URL,{
    ...proxy,
    proxyReqOptDecorator :(proxyReqOpts ,srcReq)=>{
        proxyReqOpts.headers["Content-Types"]="application/json"
        return proxyOptions
    },
    userResDecorator:(proxyRes ,proxyResData ,useReq ,userRes)=>{
        logger.info(`Response recieved from Identity Servoce : ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

app.use(errorHandler)

app.listen(PORT ,()=>{
    logger.info(`Api Gateway is running on port ${PORT}`)
     logger.info(`Identity Service is running on port ${process.env.IDENTITY_SERVICE_URL}`)
      logger.info(` Redis Url  ${process.env.REDIS_URL}`)
})