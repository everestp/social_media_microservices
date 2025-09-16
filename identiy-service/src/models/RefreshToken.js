
const mongoose = require('mongoose')
const User = require('./User')

const refreshTokenSchema = new  mongoose.Schema({
    token :{
        type:String,
        require:true,
        unique:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        require:true
    },
    expireAt:{
        type:Date,
        required:true
    }
},{timestamps :true})


refreshTokenSchema.index({expireAt:1},{expireAfterSeconds:0})


const RefreshToken = mongoose.model('RefreshToken',refreshTokenSchema)
module.exports = RefreshToken
