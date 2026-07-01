const services = require('../Models/serviceModel');
const providers = require('../Models/providerModel');

// Add a new service
exports.addService = async (req, res) => {
    const { title, price, duration, description } = req.body;
    const providerId = req.params.providerId;

    try {
        const provider = await providers.findById(providerId);
        if (!provider) {
            return res.status(404).json("Provider not found");
        }

        const newService = new services({
            providerId,
            providerEmail: provider.email,
            title,
            price,
            duration,
            description
        });
        await newService.save();
        res.status(200).json(newService);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

// Get all services for a provider
exports.getProviderServices = async (req, res) => {
    const { providerId } = req.params;
    try {
        const providerServices = await services.find({ providerId });
        res.status(200).json(providerServices);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Update a service
exports.updateService = async (req, res) => {
    const { serviceId } = req.params;
    const { title,  price, duration, description } = req.body;
    try {
        const updated = await services.findByIdAndUpdate(
            serviceId,
            { $set: { title, price, duration, description } },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json("Service not found");
        }
        res.status(200).json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error updating service details");
    }
};

// Delete a service
exports.deleteService = async (req, res) => {
    const { serviceId } = req.params;
    try {
        const deleted = await services.findByIdAndDelete(serviceId);
        if (!deleted) {
            return res.status(404).json("Service not found");
        }
        res.status(200).json("Service deleted successfully");
    } catch (err) {
        console.error(err);
        res.status(500).json("Error deleting service");
    }
};

// Get single service details
exports.getSingleService = async (req, res) => {
    const { serviceId } = req.params;
    try {
        const service = await services.findById(serviceId);
        if (!service) {
            return res.status(404).json("Service not found");
        }
        res.status(200).json(service);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error fetching service details");
    }
};
