const users = require('../Models/userModel');
const providers = require('../Models/providerModel');
const jwt = require('jsonwebtoken');

// User Registration
exports.userRegister = async (req, res) => {
    console.log("Inside userRegister");
    const { username, email, password } = req.body;
    try {
        const existingUser = await users.findOne({ email });
        const existingProvider = await providers.findOne({ email });
        
        if (existingUser || existingProvider) {
            res.status(406).json("Account with this email already exists... Please Login!!");
        } else {
            const newUser = new users({
                username: username || email, 
                email, 
                password, 
                role: 'user',
                status: 'Approved' // Users are approved by default, only providers need review
            });
            await newUser.save();
            res.status(200).json(newUser);
        }
    } catch (err) {
        console.error("User Register Error:", err);
        res.status(401).json(err.message || "Internal Server Error during registration");
    }
}

// Consolidated Login for User, Provider, and Admin
exports.login = async (req, res) => {
    console.log("Inside login");
    const { email, password } = req.body;
    try {
        // First, check in users collection (for User and Admin)
        let existingUser = await users.findOne({ email });
        if (existingUser) {
            if (password === existingUser.password) {
                const token = jwt.sign({ userId: existingUser._id }, process.env.SECRET_KEY);
                return res.status(200).json({ user: existingUser, token, role: existingUser.role });
            } else {
                return res.status(404).json("Invalid Password!!");
            }
        }

        // If not found in users, check in providers collection
        let existingProvider = await providers.findOne({ email });
        if (existingProvider) {
            if (existingProvider.status === 'Deleted') {
                return res.status(403).json("Your account has been deleted by Admin. Please contact support.");
            }
            if (existingProvider.status === 'Rejected') {
                return res.status(403).json("Your profile is rejected by admin.");
            } else if (existingProvider.status === 'Pending') {
                return res.status(403).json("Your request to login is pending admin approval.");
            } else if (existingProvider.status !== 'Approved') {
                return res.status(403).json("Your account has not been approved by the admin yet.");
            }
            
            if (password === existingProvider.password) {
                const token = jwt.sign({ userId: existingProvider._id }, process.env.SECRET_KEY);
                return res.status(200).json({ user: existingProvider, token, role: existingProvider.role });
            } else {
                return res.status(404).json("Invalid Password!!");
            }
        }

        // If not found in either
        res.status(404).json("Invalid Email / Password!!");
        
    } catch (err) {
        res.status(401).json(err);
    }
}

// Provider Registration
exports.providerRegister = async (req, res) => {
    console.log("Inside providerRegister");
    const { username, email, password, category, experience, phone, about, languages, address, aadhar, skills } = req.body;
    
    // Handle multiple files
    const profileImage = req.files && req.files.profileImage ? req.files.profileImage[0].filename : "";
    const certifications = req.files && req.files.certifications ? req.files.certifications[0].filename : "";
    const workProof = req.files && req.files.workProof ? req.files.workProof[0].filename : "";
    
    try {
        const existingUser = await users.findOne({ email });
        const existingProvider = await providers.findOne({ email });

        if (existingUser || existingProvider) {
            res.status(406).json("Account with this email already exists... Please Login!!");
        } else {
            const newProvider = new providers({
                username, email, password, role: 'provider', category, experience, phone, about, languages, address, profileImage, aadhar, skills, certifications, workProof
            });
            await newProvider.save();
            res.status(200).json(newProvider);
        }
    } catch (err) {
        console.error("Provider Register Error:", err);
        res.status(401).json(err.message || "Internal Server Error during registration");
    }
}

// Get all providers (for Admin)
exports.getAllProviders = async (req, res) => {
    try {
        const allProviders = await providers.find();
        res.status(200).json(allProviders);
    } catch (err) {
        res.status(401).json(err);
    }
}


// Get approved providers (for Home/Services)
exports.getApprovedProviders = async (req, res) => {
    try {
        const approvedProviders = await providers.find({ status: 'Approved' });
        res.status(200).json(approvedProviders);
    } catch (err) {
        res.status(401).json(err);
    }
}

// Update provider status (for Admin)
exports.updateProviderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    console.log(`Updating provider ${id} status to: ${status}`);
    try {
        const updatedProvider = await providers.findByIdAndUpdate({ _id: id }, { status }, { new: true });
        console.log("Update result:", updatedProvider ? "Success" : "Not Found");
        res.status(200).json(updatedProvider);
    } catch (err) {
        res.status(401).json(err);
    }
}

// Get single provider details
exports.getProviderDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const provider = await providers.findById({ _id: id });
        res.status(200).json(provider);
    } catch (err) {
        res.status(401).json(err);
    }
}

// Update provider profile
exports.updateProviderProfile = async (req, res) => {
    const { id } = req.params;
    // Handle files
    const profileImage = req.files && req.files.profileImage ? req.files.profileImage[0].filename : undefined;
    const certifications = req.files && req.files.certifications ? req.files.certifications[0].filename : undefined;
    const workProof = req.files && req.files.workProof ? req.files.workProof[0].filename : undefined;

    const { username, email, phone, category, experience, price, about, languages, address, aadhar, skills, availability, password } = req.body;
    
    // Parse availability if it's a string (from FormData)
    let parsedAvailability = availability;
    if (typeof availability === 'string') {
        try {
            parsedAvailability = JSON.parse(availability);
        } catch (e) {
            console.error("Error parsing availability", e);
        }
    }

    try {
        // Only include fields that are actually provided (not undefined)
        const updateFields = {};
        if (username !== undefined) updateFields.username = username;
        if (email !== undefined) updateFields.email = email;
        if (phone !== undefined) updateFields.phone = phone;
        if (category !== undefined) updateFields.category = category;
        if (experience !== undefined) updateFields.experience = experience;
        if (price !== undefined) updateFields.price = price;
        if (about !== undefined) updateFields.about = about;
        if (languages !== undefined) updateFields.languages = languages;
        if (address !== undefined) updateFields.address = address;
        if (aadhar !== undefined) updateFields.aadhar = aadhar;
        if (skills !== undefined) updateFields.skills = skills;
        if (password !== undefined && password !== "") updateFields.password = password;
        if (parsedAvailability) updateFields.availability = parsedAvailability;

        // Only include files if new ones were uploaded
        if (profileImage) updateFields.profileImage = profileImage;
        if (certifications) updateFields.certifications = certifications;
        if (workProof) updateFields.workProof = workProof;

        const updatedProvider = await providers.findByIdAndUpdate(
            { _id: id },
            { $set: updateFields },
            { new: true }
        );

        if (!updatedProvider) {
            return res.status(404).json("Provider not found");
        }

        res.status(200).json(updatedProvider);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
}

// Update user profile (Email, Password, Image)
exports.updateUserProfile = async (req, res) => {
    const { id } = req.params;
    const { email, password, username } = req.body;
    const profileImage = req.file ? req.file.filename : undefined;
    
    try {
        const updateFields = {};
        if (email) updateFields.email = email;
        if (password) updateFields.password = password;
        if (username) updateFields.username = username;
        if (profileImage) updateFields.profileImage = profileImage;

        const updatedUser = await users.findByIdAndUpdate(
            { _id: id },
            { $set: updateFields },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json("User not found");
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
}
