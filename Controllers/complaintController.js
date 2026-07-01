const bookings = require('../Models/bookingModel');
const complaints = require('../Models/complaintModel');

// User files a complaint
exports.createComplaint = async (req, res) => {
    const { bookingId, complaintText } = req.body;
    const userId = req.payload;

    if (!bookingId || !complaintText) {
        return res.status(400).json("bookingId and complaintText are required");
    }

    try {
        const booking = await bookings.findById(bookingId);
        if (!booking) {
            return res.status(404).json("Booking not found");
        }

        if (booking.userId.toString() !== userId.toString()) {
            return res.status(403).json("Unauthorized to file complaint for this booking");
        }

        const newComplaint = new complaints({
            userId,
            providerId: booking.providerId,
            bookingId,
            complaintText
        });

        await newComplaint.save();
        res.status(200).json(newComplaint);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

// Provider retrieves complaints against them
exports.getProviderComplaints = async (req, res) => {
    const providerId = req.payload; // set by jwtMiddleware
    try {
        const providerComplaints = await complaints.find({ providerId })
            .populate('userId', 'username email phone')
            .populate('bookingId', 'date timeSlot serviceId')
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'serviceId',
                    select: 'title'
                }
            });
        res.status(200).json(providerComplaints);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

// Admin retrieves all complaints
exports.getAllComplaintsAdmin = async (req, res) => {
    try {
        const allComplaints = await complaints.find()
            .populate('userId', 'username email')
            .populate('providerId', 'username email')
            .populate('bookingId', 'date serviceId')
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'serviceId',
                    select: 'title'
                }
            });
        res.status(200).json(allComplaints);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

// User retrieves complaints they have filed
exports.getUserComplaints = async (req, res) => {
    const userId = req.payload; // set by jwtMiddleware
    try {
        const userComplaints = await complaints.find({ userId })
            .populate('providerId', 'username email phone')
            .populate('bookingId', 'date timeSlot serviceId')
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'serviceId',
                    select: 'title'
                }
            });
        res.status(200).json(userComplaints);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

// User deletes/withdraws a complaint they filed
exports.deleteComplaint = async (req, res) => {
    const { id } = req.params;
    const userId = req.payload; // set by jwtMiddleware
    try {
        const complaint = await complaints.findById(id);
        if (!complaint) {
            return res.status(404).json("Complaint not found");
        }

        if (complaint.userId.toString() !== userId.toString()) {
            return res.status(403).json("Unauthorized to delete this complaint");
        }

        await complaints.findByIdAndDelete(id);
        res.status(200).json("Complaint deleted successfully");
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};


