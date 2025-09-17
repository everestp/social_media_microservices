const Joi = require('joi')

const validateRegistration = (data) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(1).required()
    })

    return schema.validate(data) // <== Pass data here
}

module.exports = { validateRegistration }



// validate Login 
const validateLogin = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(1).required()
    })

    return schema.validate(data) // <== Pass data here
}

module.exports = { validateRegistration  ,validateLogin}
