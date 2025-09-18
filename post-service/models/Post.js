

const mongoose = require('mongoose')


const postSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        require: true
    } ,
    content :{
        type:String,
        require:true

    },
    mediaIds:[
        {
            type:String
        }
    ],
    createdAt :{
        type:Date,
        default:Date.now
    }
},{timestamps:true})

 // because we will be having a differtetn serach service
postSchema.index({content :'text'})

// Very very
const Post = mongoose.model("Post",postSchema)