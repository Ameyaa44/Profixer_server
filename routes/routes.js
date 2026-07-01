const express = require('express')
const router = express.Router()
const userController = require('../Controllers/userController')
const serviceController = require('../Controllers/serviceController')
const adminController = require('../Controllers/adminController')
const bookingController = require('../Controllers/bookingController')
const complaintController = require('../Controllers/complaintController')
const multerConfig = require('../Middlewares/multerMiddleware')
const jwtMiddleware = require('../Middlewares/jwtMiddleware')

// User registration
router.post('/register', userController.userRegister)

// Consolidated login
router.post('/login', userController.login)
router.post('/provider-login', userController.login)

// Provider registration
router.post('/provider-register', multerConfig.fields([{name: 'profileImage', maxCount: 1}, {name: 'certifications', maxCount: 1}, {name: 'workProof', maxCount: 1}]), userController.providerRegister)

// Provider Management
router.get('/all-providers', userController.getAllProviders)
router.get('/approved-providers', userController.getApprovedProviders)
router.patch('/update-provider-status/:id', userController.updateProviderStatus)
router.get('/get-provider-details/:id', userController.getProviderDetails)
router.patch('/update-provider-profile/:id', multerConfig.fields([{name: 'profileImage', maxCount: 1}, {name: 'certifications', maxCount: 1}, {name: 'workProof', maxCount: 1}]), userController.updateProviderProfile)
router.patch('/update-user-profile/:id', jwtMiddleware, multerConfig.single('profileImage'), userController.updateUserProfile)

// Services
router.post('/add-service/:providerId', jwtMiddleware, serviceController.addService)
router.get('/provider-services/:providerId', serviceController.getProviderServices)
router.get('/get-service/:serviceId', serviceController.getSingleService)
router.patch('/update-service/:serviceId', jwtMiddleware, serviceController.updateService)
router.delete('/delete-service/:serviceId', jwtMiddleware, serviceController.deleteService)

// Admin Module
router.get('/admin/all-providers', jwtMiddleware, adminController.getAllProviders)
router.patch('/admin/provider-status/:id', jwtMiddleware, adminController.updateProviderStatus)
router.get('/admin/all-users', jwtMiddleware, adminController.getAllUsers)
router.get('/admin/all-services', jwtMiddleware, adminController.getAllServices)
router.delete('/admin/delete-service/:serviceId', jwtMiddleware, serviceController.deleteService)
router.delete('/admin/delete-user/:id', jwtMiddleware, adminController.deleteUser)
router.delete('/admin/delete-provider/:id', jwtMiddleware, adminController.deleteProvider)
router.get('/admin/bookings/provider/:providerId', jwtMiddleware, bookingController.getProviderBookingsForAdmin)


// Booking Module
router.post('/bookings/create', jwtMiddleware, bookingController.createBooking)
router.post('/bookings/stripe', jwtMiddleware, bookingController.bookingStripe)
router.post('/bookings/confirm-payment', jwtMiddleware, bookingController.confirmPayment)
router.get('/bookings/user', jwtMiddleware, bookingController.getUserBookings)
router.get('/bookings/provider', jwtMiddleware, bookingController.getProviderBookings)
router.get('/bookings/booked-slots', bookingController.getBookedSlots)
router.get('/bookings/valid-slots', bookingController.getValidSlots)
router.patch('/bookings/status/:id', jwtMiddleware, bookingController.updateBookingStatus)
router.patch('/bookings/review/:id', jwtMiddleware, bookingController.submitReview)
router.delete('/bookings/review/:id', jwtMiddleware, bookingController.deleteReview)
router.delete('/bookings/:id', jwtMiddleware, bookingController.deleteBooking)
router.get('/reviews/provider/:providerId', bookingController.getProviderReviews)

// Complaints Module
router.post('/complaints', jwtMiddleware, complaintController.createComplaint)
router.get('/complaints/provider', jwtMiddleware, complaintController.getProviderComplaints)
router.get('/complaints/admin', jwtMiddleware, complaintController.getAllComplaintsAdmin)
router.get('/complaints/user', jwtMiddleware, complaintController.getUserComplaints)
router.delete('/complaints/:id', jwtMiddleware, complaintController.deleteComplaint)

module.exports = router

