const logger = require("../utils/logger")
const { validateCreatePost } = require("../utils/validation")
const Post = require('../models/Post')


async function invalidatePostCache(req, input) {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);

  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}




const createPost = async(req ,res)=>{
 logger.info("Create Post API Endpoint hit.....")
 try {

        const { error } = validateCreatePost(req.body)
        if (error) {
            logger.warn("Validation error: " + error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

    const {content , mediaIds}= req.body
    
    const newlyCreatePost = new Post({
        user: req.user.userId,
        content,
        mediaIds :mediaIds || []

    })
 await newlyCreatePost.save()
 await invalidatePostCache(req ,newlyCreatePost._id.toString())
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
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) ||10;
    const startIndex = (page-1) *limit;
    const cacheKey =`posts:${page} :${limit}`
    const cachedPosts = await req.redisClient.get(cacheKey)

    //if  present in cached then it return the result
    if(cachedPosts){
        return res.json(JSON.parse(cachedPosts))

    }
const posts = await Post.find({})
.sort({createdAt:-1})
.skip(startIndex)
.limit(limit)

const totalNoOfPosts = await Post.countDocuments()
const result = {
    posts,
    currentPage:page,
    totalPages: Math.ceil(totalNoOfPosts/limit),
    totalPosts:totalNoOfPosts
}

//save your post to redis cached
await req.redisClient.setex(cacheKey ,300 ,JSON.stringify(result))
res.json(result)
    
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
    const postId = req.params.id;
    const cacheKey = `post:${postId}`

       const cachedPost = await req.redisClient.get(cacheKey)

    //if  present in cached then it return the result
    if(cachedPost){
        return res.json(JSON.parse(cachedPost))

    }
    const singlePostDetailsbyId = await Post.findById(postId)
    if(!singlePostDetailsbyId){
        return res.status(404).json({
            sucess:false,
            message:'Post not found'

        })
    }

    await req.redisClient.setex(cachedPost ,3600 ,JSON.stringify(singlePostDetailsbyId))
    res.json(singlePostDetailsbyId)

 } catch (error) {
    logger.error("Error  getting single Post",error)
    res.status(500).json({
        sucess:false ,
        message:"Error  fetching single Post"
    })
 }

   
}

//delete  post
const deletePost= async(req ,res)=>{
 logger.info("Delete Post  API Endpoint hit.....")
 try {
  const post = await Post.findOneAndDelete({
    _id: req.params.id,
    user:req.user.userId

  })
  if(!post){
        return res.status(404).json({
            sucess:false,
            message:'Post not found'

        })
    }
await invalidatePostCache(req ,req.params.id);
 res.status(200).json({
           sucess:true,
           message:"Post delete sucessfully",
           
       })

 } catch (error) {
    logger.error("Error  deleting  Post",error)
    res.status(500).json({
        sucess:false ,
        message:"Error  Deleting Post"
    })
 }

   
}


module.exports ={createPost ,getAllPost ,getPost ,deletePost}