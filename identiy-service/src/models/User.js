const mongoose = require('mongoose')
const argon2 = require('argon2')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now // ✅ fix
  }
}, { timestamps: true })

// ✅ Password hashing middleware
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      this.password = await argon2.hash(this.password)
    } catch (error) {
      return next(error)
    }
  }
  next() // ✅ always call next()
})

// ✅ Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await argon2.verify(this.password, candidatePassword)
  } catch (error) {
    // log or handle if needed
    return false
  }
}

// ✅ Text index for search
userSchema.index({ username: 'text' })

const User = mongoose.model("User", userSchema)

module.exports = User
