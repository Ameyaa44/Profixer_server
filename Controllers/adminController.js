const providers = require('../Models/providerModel');
const users = require('../Models/userModel');
const services = require('../Models/serviceModel');

// Get all providers (Pending/Approved/Rejected)
exports.getAllProviders = async (req, res) => {
    try {
        const allProviders = await providers.find();
        res.status(200).json(allProviders);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Update provider status (Approve/Reject)
exports.updateProviderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    try {
        const updatedProvider = await providers.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
        if (!updatedProvider) {
            return res.status(404).json("Provider not found");
        }
        res.status(200).json(updatedProvider);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const allUsers = await users.find({ role: 'user' });
        res.status(200).json(allUsers);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Get all services across all providers
exports.getAllServices = async (req, res) => {
    try {
        const allServices = await services.find().populate('providerId', 'username email');
        res.status(200).json(allServices);
    } catch (err) {
        res.status(500).json(err);
    }
};


// Delete user account (Admin only)
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await users.findByIdAndDelete(id);
        res.status(200).json("User account deleted by admin");
    } catch (err) {
        res.status(500).json(err);
    }
};

// Delete provider account (Admin only)
exports.deleteProvider = async (req, res) => {
    const { id } = req.params;
    try {
        await providers.findByIdAndDelete(id);
        res.status(200).json("Professional account deleted by admin");
    } catch (err) {
        res.status(500).json(err);
    }
};
