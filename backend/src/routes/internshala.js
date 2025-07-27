import express from 'express';
import { getInternshalaJobs } from '../controllers/internshala.controller.js';

const router = express.Router();

router.get('/jobs', getInternshalaJobs);

export default router; 