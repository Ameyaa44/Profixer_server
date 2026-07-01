const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        const filename = `file-${Date.now()}-${file.originalname}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/png', 'image/jpg', 'image/jpeg',
        'application/pdf'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
        return cb(new Error("Only .png, .jpg, .jpeg, and .pdf formats allowed!"));
    }
};

const multerConfig = multer({
    storage,
    fileFilter
});

module.exports = multerConfig;
