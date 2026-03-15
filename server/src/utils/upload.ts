import multer from 'multer';
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and PDF are allowed.') as any, false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Global max 5MB, specific field limits handled in routes or controller if needed
    }
});
