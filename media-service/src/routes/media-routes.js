const express = require('express')
const multer = require('multer')

const {uploadMedia}= require('../controllers/media-controller')
const {authenticateRequest}= require('../middleware/authMiddleware')
const logger = require('../utils/logger')
const router = express.Router()


//confuigure multer for file upload

const upload = multer({
    storage :multer.memoryStorage,
    limits :{
        fileSize : 5 * 1024 * 1024
         
    }
}).single('file')

router.post('/upload',authenticateRequest ,(req ,res ,next)=>{
    upload(req ,res,function(error){
        if(err instanceof multer.MulterError){
            logger.warn("Multer error while uploading",err)
            return res.status(400).json({
                message:"Mutler error while uplaoding ",
                error :err.message,
                stack:err.stack
            })
        } else if(err){
              logger.warn("Unknown error occurred while uplaoding",err)
            return res.status(400).json({
                message:"Unknown error occurred  while uplaoding ",
                error :err.message,
                stack:err.stack
            })
        }
        if(!req.file){
              return res.status(400).json({
                message:"No file found",
            
            })
        }
            next()
    })

    
} ,uploadMedia)

module.exports =  Router

