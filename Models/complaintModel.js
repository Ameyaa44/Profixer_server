const mongoose = require('mongoose')

const complaintSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'providers',
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'bookings',
        required: true
    },
    complaintText: {
        type: String,
        required: true
    }
}, { timestamps: true })

const complaints = mongoose.model('complaints', complaintSchema)

module.exports = complaints
