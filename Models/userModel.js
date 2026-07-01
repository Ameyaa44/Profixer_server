const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user'
    },
    status: {
        type: String,
        default: 'Pending'
    },
    profileImage: { type: String },
    certifications: { type: String },
    workProof: { type: String },
    aadhar: { type: String },
    skills: { type: String },
    phone: { type: String },
    address: { type: String },
    category: { type: String },
    experience: { type: String },
    price: { type: Number },
    about: { type: String },
    languages: { type: String },
    rating: { type: Number, default: 0 },
    availability: {
        type: Object,
        default: {}
    }
})

const users = mongoose.model('users', userSchema)

module.exports = users
