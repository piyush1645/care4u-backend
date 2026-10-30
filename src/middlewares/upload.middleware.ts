import multer from 'multer';
import { BadRequestError } from '../common/handlers/error.handlers.js';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter(_req, file, callback) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new BadRequestError('Invalid File type'));
    }
  },
});
