const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
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
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'services',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    timeSlot: {
        type: String,
        required: true
    },
    endTime: {
        type: String
    },
    location: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Pending' // Pending, Accepted, Rejected, Cancelled, WorkCompleted, Completed
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: {
        type: String
    },
    reviewDate: {
        type: Date
    },
    paymentStatus: {
        type: String,
        default: 'Unpaid' // Unpaid, Paid
    },
    stripeSessionId: {
        type: String
    }
}, { timestamps: true })

const bookings = mongoose.model('bookings', bookingSchema)

module.exports = bookings
