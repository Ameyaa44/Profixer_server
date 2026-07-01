const mongoose = require('mongoose')

const providerSchema = new mongoose.Schema({
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
        default: 'provider'
    },
    category: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: true
    },
    about: {
        type: String,
        required: true
    },
    languages: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    profileImage: {
        type: String
    },
    aadhar: {
        type: String,
        required: true
    },
    skills: {
        type: String,
        required: true
    },
    certifications: {
        type: String
    },
    workProof: {
        type: String
    },
    status: {
        type: String,
        default: 'Pending'
    },
    rating: {
        type: Number,
        default: 0
    },
    reviewsCount: {
        type: Number,
        default: 0
    },
    availability: {
        type: Object,
        default: {
            Monday: { isWorkingDay: true, slots: [{ start: '09:00', end: '18:00' }] },
            Tuesday: { isWorkingDay: true, slots: [{ start: '09:00', end: '18:00' }] },
            Wednesday: { isWorkingDay: true, slots: [{ start: '09:00', end: '18:00' }] },
            Thursday: { isWorkingDay: true, slots: [{ start: '09:00', end: '18:00' }] },
            Friday: { isWorkingDay: true, slots: [{ start: '09:00', end: '18:00' }] },
            Saturday: { isWorkingDay: false, slots: [] },
            Sunday: { isWorkingDay: false, slots: [] },
        }
    }
})


const providers = mongoose.model('providers', providerSchema)

module.exports = providers
