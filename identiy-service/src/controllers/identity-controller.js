

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

    } catch (error) {
        
    }
}


//user login


//refresh token

//logout


