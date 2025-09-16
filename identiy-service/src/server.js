  require('dotenv').config()
 const mongoose = require('mongoose')
const logger = require('./utils/logger')
const express = require('express')
 const  app = express()
 const helmet = require('helmet')
 const cors = require('cors')
 const Redis = require('ioredis')
 const {RateLimiterRedis}= require('rate-limiter-flexible')
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
