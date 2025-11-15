import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

export const multerPDFUploadOptions = {
  storage: diskStorage({
    destination: (req: any, file: any, cb: any) => {
      cb(null, 'public/documents/');
    },
    filename: (req: any, file: any, cb: any) => {
      const uniqueName = `${uuid()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.match(/\/(pdf)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
};
