const bookings = require('../Models/bookingModel');
const providers = require('../Models/providerModel');
const services = require('../Models/serviceModel');

// Helper to convert time string (HH:MM or HH:MM AM/PM) to decimal hours
const timeToDecimal = (timeStr) => {
    if (!timeStr) return 0;
    let [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours + (minutes / 60);
};

// Helper to format decimal hours to AM/PM string
const decimalToTimeStr = (decimal) => {
    let hours = Math.floor(decimal);
    let minutes = Math.round((decimal - hours) * 60);
    const modifier = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${modifier}`;
};

// Create a new booking
exports.createBooking = async (req, res) => {
    const { providerId, serviceId, date, timeSlot, endTime, location, price } = req.body;
    const userId = req.payload; // From jwtMiddleware

    try {
        const newBooking = new bookings({
            userId,
            providerId,
            serviceId,
            date,
            timeSlot,
            endTime,
            location,
            price
        });
        await newBooking.save();
        res.status(200).json(newBooking);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

// Get bookings for a user
exports.getUserBookings = async (req, res) => {
    const userId = req.payload;
    try {
        const userBookings = await bookings.find({ userId }).populate('providerId', 'username email phone').populate('serviceId', 'title');
        res.status(200).json(userBookings);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Get bookings for a provider
exports.getProviderBookings = async (req, res) => {
    const providerId = req.payload; // In this app, provider login also sets req.payload = _id
    try {
        const providerBookings = await bookings.find({ providerId }).populate('userId', 'username email phone').populate('serviceId', 'title');
        res.status(200).json(providerBookings);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Update booking status (Accept/Reject/Complete/Cancel/WorkCompleted)
exports.updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const updatedBooking = await bookings.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
        res.status(200).json(updatedBooking);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Submit Review and Rating
exports.submitReview = async (req, res) => {
    const { id } = req.params;
    const { rating, review } = req.body;
    const userId = req.payload;

    try {
        const booking = await bookings.findById(id);
        if (!booking) {
            return res.status(404).json("Booking not found");
        }

        // Allow reviewing if status is Completed
        if (booking.status !== 'Completed') {
            return res.status(400).json("Please confirm the completion of service before leaving a review.");
        }

        // Update booking with review data
        booking.rating = Number(rating);
        booking.review = review || "Excellent service!";
        booking.reviewDate = new Date();
        await booking.save();

        // Update provider rating statistics
        const providerId = booking.providerId;
        const provider = await providers.findById(providerId);
        
        if (provider) {
            // Recalculate average rating
            const providerReviews = await bookings.find({ 
                providerId, 
                rating: { $exists: true, $ne: null } 
            });
            
            if (providerReviews.length > 0) {
                const totalRating = providerReviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
                provider.reviewsCount = providerReviews.length;
                const average = totalRating / providerReviews.length;
                provider.rating = Number(average.toFixed(1));
            } else {
                provider.reviewsCount = 1;
                provider.rating = Number(rating);
            }
            await provider.save();
        }

        res.status(200).json(booking);
    } catch (err) {
        console.error("Review Submission Error:", err);
        res.status(500).json(err.message || "An internal error occurred while saving your review.");
    }
};
// Get booked slots for a provider on a specific date
exports.getBookedSlots = async (req, res) => {
    const { providerId, date } = req.query;
    try {
        // Find bookings that are NOT Cancelled or Rejected for this provider and date
        const booked = await bookings.find({
            providerId,
            date,
            status: { $in: ['Pending', 'Accepted', 'WorkCompleted', 'Completed'] }
        }, 'timeSlot');
        
        const slots = booked.map(b => b.timeSlot);
        res.status(200).json(slots);
    } catch (err) {
        res.status(500).json(err);
    }
};
// Get valid start times based on availability, duration, and existing bookings
exports.getValidSlots = async (req, res) => {
    const { providerId, serviceId, date } = req.query;
    try {
        const provider = await providers.findById(providerId);
        const service = await services.findById(serviceId);
        if (!provider || !service) return res.status(404).json("Provider or Service not found");

        // Extract the day name directly from the date string (e.g. "Wednesday, May 6, 2026" → "Wednesday")
        const dayName = date.split(',')[0].trim();
        const dayAvailability = provider.availability?.[dayName];

        if (!dayAvailability || !dayAvailability.isWorkingDay || !dayAvailability.slots.length) {
            return res.status(200).json([]);
        }

        const durationMatch = service.duration.match(/\d+/);
        const durationHours = durationMatch ? parseInt(durationMatch[0]) : 1;

        // Fetch existing bookings with their service details to know their durations
        const existingBookings = await bookings.find({
            providerId,
            date,
            status: { $in: ['Pending', 'Accepted', 'WorkCompleted', 'Completed'] }
        }).populate('serviceId');

        const validSlots = [];
        const buffer = 1; // 1-hour mandatory buffer

        // Check if requested date is today
        // Date format from frontend: "Wednesday, May 6, 2026"
        const dateParts = date.split(',').map(s => s.trim());
        const cleanDateStr = dateParts.length > 2 ? `${dateParts[1]}, ${dateParts[2]}` : date;
        const isToday = new Date(cleanDateStr).toDateString() === new Date().toDateString();
        
        const now = new Date();
        const currentTimeDecimal = now.getHours() + (now.getMinutes() / 60);

        dayAvailability.slots.forEach(workSlot => {
            let start = timeToDecimal(workSlot.start);
            let end = timeToDecimal(workSlot.end);

            // Step by 30 mins (0.5)
            for (let current = start; current + durationHours + buffer <= end; current += 0.5) {
                // If it's today, skip slots that have already started
                if (isToday && current <= currentTimeDecimal) {
                    continue;
                }

                // The block of time this new booking will consume (including buffer)
                const currentBlockEnd = current + durationHours + buffer;
                
                // Check for overlaps with any existing booking
                const hasOverlap = existingBookings.some(b => {
                    const bStart = timeToDecimal(b.timeSlot);
                    const bDurationMatch = b.serviceId?.duration?.match(/\d+/);
                    const bDuration = bDurationMatch ? parseInt(bDurationMatch[0]) : 1;
                    const bBlockEnd = bStart + bDuration + buffer;
                    
                    // Two intervals overlap if (StartA < EndB) and (EndA > StartB)
                    return (current < bBlockEnd) && (currentBlockEnd > bStart);
                });

                if (!hasOverlap) {
                    validSlots.push({
                        time: decimalToTimeStr(current),
                        endTime: decimalToTimeStr(current + durationHours) // End time shown to user does not include buffer
                    });
                }
            }
        });

        res.status(200).json(validSlots);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

// Get reviews for a provider (Public)
exports.getProviderReviews = async (req, res) => {
    const { providerId } = req.params;
    try {
        const reviews = await bookings.find({ 
            providerId, 
            status: 'Completed',
            rating: { $exists: true }
        }).populate('userId', 'username').populate('serviceId', 'title');
        res.status(200).json(reviews);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Delete Review and Update Provider Rating
exports.deleteReview = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Find the booking first to get providerId
        const booking = await bookings.findById(id);
        if (!booking) return res.status(404).json("Booking not found");

        const providerId = booking.providerId;

        // 2. Remove review fields from booking
        await bookings.findByIdAndUpdate(id, {
            $unset: { rating: 1, review: 1, reviewDate: 1 }
        });

        // 3. Recalculate provider rating
        const provider = await providers.findById(providerId);
        if (provider) {
            // Get all bookings for this provider that have a rating
            const providerReviews = await bookings.find({ 
                providerId, 
                rating: { $exists: true, $ne: null } 
            });
            
            let newRating = 0;
            let newCount = 0;

            if (providerReviews.length > 0) {
                const totalRating = providerReviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
                newCount = providerReviews.length;
                newRating = Number((totalRating / newCount).toFixed(1));
            }

            // Update provider with new stats
            await providers.findByIdAndUpdate(providerId, {
                rating: newRating,
                reviewsCount: newCount
            });
        }

        res.status(200).json({ message: "Review deleted successfully" });
    } catch (err) {
        console.error("Delete Review Error:", err);
        res.status(400).json({ error: err.message || "Failed to delete review" });
    }
};

// Delete a booking record
exports.deleteBooking = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedBooking = await bookings.findByIdAndDelete(id);
        if (!deletedBooking) {
            return res.status(404).json("Booking not found");
        }
        res.status(200).json("Booking deleted successfully");
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};



exports.bookingStripe = async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET);
    const { providerId, serviceId, date, timeSlot, endTime, location, price, serviceName } = req.body;
    const userId = req.payload;

    try {
        const newBooking = new bookings({
            userId,
            providerId,
            serviceId,
            date,
            timeSlot,
            endTime,
            location,
            price,
            paymentStatus: 'Unpaid'
        });
        await newBooking.save();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: serviceName || 'ProFixer Service',
                    },
                    unit_amount: 100, // Fixed 100 INR
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `http://localhost:5173/payment-success`,
            cancel_url: `http://localhost:5173/payment-cancel`,
        });

        newBooking.stripeSessionId = session.id;
        await newBooking.save();

        res.status(200).json({ id: session.id, url: session.url, booking: newBooking });
    } catch (err) {
        console.error("Stripe Session Error:", err);
        res.status(500).json(err.message || "Internal Server Error");
    }
}

exports.confirmPayment = async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET);
    const userId = req.payload; // From jwtMiddleware
    
    try {
        // Find the most recent unpaid booking for this user
        const booking = await bookings.findOne({ userId, paymentStatus: 'Unpaid' }).sort({ createdAt: -1 });
        
        if (!booking || !booking.stripeSessionId) {
            return res.status(404).json("No pending payment found for this user");
        }

        const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
        
        if (session.payment_status === 'paid') {
            booking.paymentStatus = 'Paid';
            await booking.save();
            res.status(200).json(booking);
        } else {
            res.status(400).json("Payment not confirmed");
        }
    } catch (err) {
        console.error("Confirm Payment Error:", err);
        res.status(500).json(err.message || "Internal Server Error");
    }
}

// Get all bookings of a specific provider for admin reporting
exports.getProviderBookingsForAdmin = async (req, res) => {
    const { providerId } = req.params;
    try {
        const providerBookings = await bookings.find({ providerId })
            .populate('userId', 'username email phone')
            .populate('serviceId', 'title');
        res.status(200).json(providerBookings);
    } catch (err) {
        console.error("Get Provider Bookings For Admin Error:", err);
        res.status(500).json(err.message || "Internal Server Error");
    }
}