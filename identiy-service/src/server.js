  require('dotenv').config()
 const mongoose = require('mongoose')
const logger = require('./utils/logger')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const Redis = require('ioredis')
const {RateLimiterRedis}= require('rate-limiter-flexible')
const {rateLimit}= require('express-rate-limit')
const {RedisStore}= require('rate-limit-redis')

const routes = require('./routes/identity-service')
const errorHandler = require('./middleware/errorHandler')
const  app = express()
const PORT =process.env.PORT || 3001
 //connect to mongodb
 mongoose.connect(process.env.MONGO_URI).then(

    ()=>{
        logger.info("Connected to Mongodvb")
    }
 ).catch(e =>logger.error("Mongo Connection  error",e))

const redisClient = new Redis(process.env.REDIS_URL)

 //middleware

 app.use(helmet())
 app.use(cors())
 app.use(express.json())

 app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request Body ${req.bo}`)
    next()

 })

 //DDOS protection
 
 const rateLimiter = new RateLimiterRedis({
    storeClient:redisClient,
    keyPrefix: 'middleware',
    points:10,
    duration:1
 })
app.use((req ,res ,next)=>{
    rateLimiter.consume(req.ip).then(()=>next()).catch(()=>{
        logger.warn(`Rate Limit exceeds for IP :${req.ip}`)
        res.status(429).json({
            sucess:false,
            message:'Too many Request'
        })
    })
})




//Ip based Rate Limiting for sensentive endpoints

const sensentiveEndPointsLimiter =  rateLimit({
    windowMs : 15 *60 *1000,
    max:50,
    standardHeaders:true,
    legacyHeaders:false,
    handler:(req ,res)=>{
        logger.warn(`Sensentive endPoint rate limits  exceed for I{: ${req.ip}}`),
          res.status(429).json({
            sucess:false,
            message:'Too many Request'
        })

    },
    store : new RedisStore({
        sendCommand :(...args)=> redisClient.call(...args)
    })
})


 //apply  this sensentive endpoint 

 app.use('/api/auth/register',sensentiveEndPointsLimiter)


 app.use('/api/auth',routes)

 //error handler
 app.use(errorHandler)


 //started the server
cosnt 
 app.listen(PORT,()=>{
    logger.info(`Identity service is runniing at ${PORT}`)


 })



 //Unhandled promise p
 process.on('unhandledRejection',(reason ,promise)=>{
 logger.error("Unhandled Rejection at ",promise ,"reason :",reason)

 })
 

