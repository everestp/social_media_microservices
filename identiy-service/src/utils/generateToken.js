
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const RefreshToken = require('../models/RefreshToken')

const generateToken = async (user) => {
    const accessToken = jwt.sign(
        {
            userId: user._id,
            username: user.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: '60m' } // ideally 15m in production
    )

    const refreshToken = crypto.randomBytes(40).toString('hex')
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + 7) // refresh token expires in 7 days

    await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expireAt
    })

    return { accessToken, refreshToken } // ✅ Corrected return
}

module.exports = generateToken



//  3:48 node js part 2 sangam mukherjee youtube channel ===>Remember  there  is no  perfect code and the production grade application take year to create and  there are many developer there so dont woerry chill and practise  nothing is perfect

