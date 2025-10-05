const logger = require("../../../api-gateway/src/utils/logger")
const Media = require("../models/Media")
const { uploadMediaToCloudinary } = require("../utils/cloudinary")

  const uploadMedia =   async (req ,res)=>{
  logger.info("Starting media upload")
try {
    if(!req.file){
        logger.error('No  file found Please try adding the file and try again ')
        return res.status(400).json({
            sucess:false,
            message:'No file found .Please add file to continue'
        })
    }

    const {originalName , mimeType , buffer} = req.file;
    const userId = req.user.userId;
    logger.info(`File details :name=${originalName} ,type=${mimeType}`)
    logger.info("Uploading to cloudinary starting")
    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file)
    logger.info(`Cloudinary  upload suncessfully Public Id ${cloudinaryUploadResult.public_id}`)

const newlyCreatedMedia = new Media({
    publicId :cloudinaryUploadResult.public_id,
    orginalName,
    mimeType,
    url:cloudinaryUploadResult.secret_url,
    userId
})

await newlyCreatedMedia.save()
res.status(201).json({
 sucess:true ,
 mediaId:newlyCreatedMedia._id,
 url:newlyCreatedMedia.url,
 message:"Media upload is sucessfull"
})

} catch (error) {
     logger.error("Error creating post",error)
    res.status(500).json({
        sucess:false ,
        message:"Error creating post"
    })
}

  }


  module.exports ={uploadMedia}