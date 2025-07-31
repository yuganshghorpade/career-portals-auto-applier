import { autoApplyOnInternshala } from '../utils/internshalaAutoApplier.util.js';
export const autoApplyInternshalaJobs = async (req, res) => {
  try {
    const { keywords, resumebody, localpath } = req.body;
    const result = await autoApplyOnInternshala(keywords, resumebody,localpath);
    res.status(200).json({ message: `Auto-applied to ${result.applied} out of ${result.attempted} jobs.`, result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};


import { scrapeInternshalaJobs } from '../utils/internshalaScraper.util.js';

export const getInternshalaJobs = async (req, res) => {
  try {
    const keywords = req.body.keywords
    const jobs = await scrapeInternshalaJobs(keywords);
    console.log(jobs);
    res.status(200).json({ message: "Jobs fetched successfully", jobs });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}; 

import { scrapeApplicationStatuses } from '../utils/internshalaApplicationTracker.util.js'; // update path as needed

export const getInternshalaApplicationStatuses = async (req, res) => {
  try {
    const data = await scrapeApplicationStatuses();
    res.status(200).json({ message: `${data.totalApplications} job applications tracked successfully.`, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
