import { scrapeGlassdoorJobs } from '../utils/glassdoorScraper.util.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ConsoleMessage } from 'puppeteer';

export const getGlassdoorJobs = async (req, res) => {
  try {
    const keywords = req.body.keywords
    const jobs = await scrapeGlassdoorJobs(keywords);
    console.log(jobs);
    res.status(200).json(new ApiResponse(200, jobs, 'Jobs fetched successfully'));
  } catch (error) {
    res.status(500).json(new ApiError(500, 'Failed to fetch jobs', [error.message]));
  }
}; 