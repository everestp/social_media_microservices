const logger = require("../utils/logger")


const createPost = async(req ,res)=>{
 logger.info("Create Post API Endpoint hit.....")
 try {
    const {content , mediaIds}= req.body
    const newlyCreatePost = new postMessage({
        user: req.user.userId,
        content,
        mediaIds :mediaIds || []

    })
 await newlyCreatePost.save()
 logger.info("Post created Sucessfully",newlyCreatePost)
 res.status(201).json({
    sucess:true,
    message :'Post  create Sucessfully'

 })



 } catch (error) {
    logger.error("Error creating post",error)
    res.status(500).json({
        sucess:false ,
        message:"Error creating post"
    })
 }

   
}



const getAllPost = async(req ,res)=>{
 logger.info("Create Post API Endpoint hit.....")
 try {
    
 } catch (error) {
    logger.error("Error creating post",error)
    res.status(500).json({
        sucess:false ,
        message:"Error  fetching postd"
    })
 }

   
}


// Get single post
const getPost= async(req ,res)=>{
 logger.info("Create Post API Endpoint hit.....")
 try {
    
 } catch (error) {
    logger.error("Error  getting single Post",error)
    res.status(500).json({
        sucess:false ,
        message:"Error  fetching single Post"
    })
 }

   
}


module.exports ={createPost}