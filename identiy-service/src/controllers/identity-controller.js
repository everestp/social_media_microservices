const RefreshToken = require('../models/RefreshToken')
const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const logger = require('../utils/logger')
const { validateRegistration, validateLogin } = require('../utils/validation')

// user registration
const registerUser = async (req, res) => {
    logger.info("Registration endpoint hit...")

    try {
        const { error } = validateRegistration(req.body)
        if (error) {
            logger.warn("Validation error: " + error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

        const { email, password, username } = req.body

        let existingUser = await User.findOne({ $or: [{ email }, { username }] })
        if (existingUser) {
            const conflictField = existingUser.email === email ? "Email" : "Username"
            logger.warn(`${conflictField} already exists`)
            return res.status(400).json({
                success: false,
                message: `${conflictField} is already in use`
            })
        }

        const newlyCreatedUser = new User({ username, email, password })
        logger.info("Saving user...")
        await newlyCreatedUser.save()
        logger.info("User saved successfully: " + newlyCreatedUser._id)

        logger.info("Generating token...")
        const { accessToken, refreshToken } = await generateToken(newlyCreatedUser)
        logger.info("Token generated.")

        res.status(201).json({
            success: true,
            message: 'User is registered successfully',
            accessToken,
            refreshToken
        })

    } catch (error) {
        logger.error("Registration error occurred", error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}


//user login
 const loginUser = async(req ,res)=>{
    logger.info('Login endpoint hits....')
    try {
        const {error}= validateLogin(req.body)
        if (error) {
            logger.warn("Validation error: " + error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

        const { email, password } = req.body
         

         //check the  user is present in Database
         const user = await User.findOne({email})
         if(!user){
            logger.warn('Invalid User')
            return res.status(400).json({
                success:false,
                message:"Invalid Crendtianls"

            })


         }


         // valid passoword and username or not
         const isValidPassword = await user.comparePassword(password)
                 if(!isValidPassword){
            logger.warn('Invalid User')
            return res.status(400).json({
                success:false,
                message:"Invalid Password"

            })
        }

        const {accessToken ,refreshToken}= await generateToken(user)
        
        res.json({
            message:"Login Suncessfull",
            accessToken ,
            refreshToken,
            userId :user._id
        })







    } catch (error) {
        logger.error("Login  error occurred", error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
 }


 // refresh token
 const refreshTokenUser= async(req ,res)=>{
      logger.info(" Refresh token  endpoint hits")
      try {

        // get our refresh token 
        const {refreshToken}=req.body()
         if(!refreshToken){
            logger.warn('Refresh token missing')
             return res.status(400).json({
                success: false,
                message: "Refresh token missing"
            })
         }
        

         // get our stored token
        const storeToken = await RefreshToken.findOne({token:refreshToken})
        if(!storeToken || storeToken.expireAt < new Date()){
            logger.warn("Invalid or expired refresh Token")
            return res.status(400).json({
                success:false,
                message:'Invalid or expired refresh token'


            })

        }
        //find the user
        const user = await User.findById(storeToken.user)
        if(!user){
              logger.warn(" User not found")
            return res.status(400).json({
                success:false,
                message:' user not found'


            })
        }

        // Generate a new troken

        const {accessToken:newAccessToken ,refreshToken:newRefreshToken}= await generateToken(user)

        

        //delete the existing refresh token -----> Very very important
        await RefreshToken.deleteOne({_id:storeToken._id})

        res.json({
            accessToken:newAccessToken,
            refreshToken:newRefreshToken
        })












      } catch (error) {

         logger.error("Error generating refresh token", error)

        res.status(500).json({
            success: false,
            message: ' Refresh token create Error'
        })
      }
 }



 //logout
const logoutUser = async(req ,res)=>{
    logger.info("Logout endpoint hit")
    try {
        // get our refresh token 
        const {refreshToken}=req.body()
         if(!refreshToken){
            logger.warn('Refresh token missing')
             return res.status(400).json({
                success: false,
                message: "Refresh token missing"
            })
         }

         await RefreshToken.deleteOne({token:refreshToken})
         logger.info("Refresh token delete for logout")

         res.json({
            success:true,
            message:"Loggedout sucessfully"

         })




    } catch (error) {
          logger.error("Error while logging out")
            return res.status(500).json({
                success:false,
                message:'Internal Server error'


            })
    }
}



module.exports = { registerUser ,loginUser ,refreshTokenUser ,logoutUser}
