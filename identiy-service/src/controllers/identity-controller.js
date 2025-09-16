

const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const logger= require('../utils/logger')
const { validateRegistration } = require('../utils/validation')

//user registration

const registerUser = async(req ,res)=>{
    logger.info("Registration endpoint hit...")
    try {
        // validate the schema
        const {error} = validateRegistration(req.body)
        if(error){
            logger.warn("Validation error",error.details[0].message)
            return res.status(400).json({
                sucess:false,
                message : error.details[0].message
            })
        }

        const {email , password , username}= req.body
        let user = await User.findOne({$or :[{email},{username}]})
        if(user){
             logger.warn("User already exists")
            return res.status(400).json({
                sucess:false,
                message :"User already exist"
            })
        }

        const newlyCreateUser  = new User({username ,email,password})
        await newlyCreateUser.save()
        logger.warn("User saved Sucessfully",newlyCreateUser._id)
        const {accessToken ,refreshToken}=   await generateToken(user)
   res.status(201).json({
    sucess:true,
    message:'User is register sucessfully'
   })

   
    } catch (error) {
        
    }
}


//user login


//refresh token

//logout


