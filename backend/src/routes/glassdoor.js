import express from 'express';
import { getGlassdoorJobs } from '../controllers/glassdoor.controller.js';

const router = express.Router();

router.post('/jobs', getGlassdoorJobs);

export default router; 