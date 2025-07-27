import { scrapeInternshalaJobs } from '../utils/internshalaScraper.util.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const getInternshalaJobs = async (req, res) => {
  try {
    const jobs = await scrapeInternshalaJobs();
    console.log(jobs);
    res.status(200).json(new ApiResponse(200, jobs, 'Jobs fetched successfully'));
  } catch (error) {
    console.log(error);
    res.status(500).json(new ApiError(500, 'Failed to fetch jobs', [error.message]));
  }
}; 