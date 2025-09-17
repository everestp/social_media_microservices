const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const logger = require('../utils/logger')
const { validateRegistration } = require('../utils/validation')

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

module.exports = { registerUser }
