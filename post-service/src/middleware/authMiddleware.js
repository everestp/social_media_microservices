const logger = require("../utils/logger")



const authenticateRequest = (req ,res,next)=>{
    const userId = req.header['x-user-id']
    if(!userId){
        logger.warn('Access attempted without userId')
        return res.status(401).json({
            sucess:false,
            message:'Authentication required ! Please login to continue'
        })
    }
    req.user = {userId}
    next()
}

module.exports = {authenticateRequest}