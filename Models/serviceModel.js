const mongoose = require('mongoose')

const serviceSchema = new mongoose.Schema({
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'providers',
        required: true
    },
    providerEmail: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },

    price: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Active'
    }
}, { timestamps: true })

const services = mongoose.model('services', serviceSchema)

module.exports = services
