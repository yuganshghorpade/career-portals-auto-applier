import express from 'express';
import { getInternshalaJobs, autoApplyInternshalaJobs, getInternshalaApplicationStatuses } from '../controllers/internshala.controller.js';

const router = express.Router();

router.post('/jobs', getInternshalaJobs);
router.post('/auto-apply', autoApplyInternshalaJobs);
router.get('/track', getInternshalaApplicationStatuses)

export default router; 