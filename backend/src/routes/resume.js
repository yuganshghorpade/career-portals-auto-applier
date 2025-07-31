import express from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { fetchResume, uploadResume } from '../controllers/resume.controller.js';

const router = express.Router();

router.post('/upload', upload.single('resume'), uploadResume);
router.get('/fetch', fetchResume);


export default router; 