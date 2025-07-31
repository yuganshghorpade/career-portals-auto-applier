import uploadOncloudinary from "../utils/cloudinary.util.js";
import docxParser from "docx-parser";
import path from "path";
import { parseResumeWithGemini } from "../utils/resumeparser.util.js";
import { scrapeGlassdoorJobs } from "../utils/glassdoorScraper.util.js";
import mongoose from "mongoose"; // ✅ Import the right function
import { Resumedata } from "../models/user.model.js";

const uploadResume = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    let rdata = "";
    const resumeLocalPath = req.file.path;

    // 📝 Parse .docx file
    if (path.extname(req.file.originalname).toLowerCase() === ".docx") {
        rdata = await new Promise((resolve, reject) => {
            docxParser.parseDocx(resumeLocalPath, (data) => {
                if (!data) return reject(new Error("DOCX parsing failed"));
                resolve(data);
            });
        });
    }

    let resumeData = null;
    let jobs = [];

    try {
        // 🤖 Extract structured data from resume
        resumeData = await parseResumeWithGemini(rdata);
        console.log("🎯 Parsed Resume Data:", resumeData);

        const resume = await uploadOncloudinary(resumeLocalPath);
        if (!resume.data.url) {
            throw new ApiError(400, "Error while uploading resume");
        }
        
        console.log("uploaded on cloudinary")
        const createdresume = await Resumedata.create({
            name: req.file.originalname,
            url: resume.data.url,
            keywords: resumeData.applyKeywords,
            body: rdata,
            localpath: resumeLocalPath,
        });

        res.status(200).json({
            image: resume.data.url,
            message: "Resume uploaded and analysed successfully",
            filePath: `/temp/${req.file.filename}`,
            originalName: req.file.originalname,
            resumeData,
            jobs,
        });

        // 🔑 Extract keywords and scrape jobs from Glassdoor
        // const keywords = resumeData.applyKeywords;
        // jobs = await scrapeGlassdoorJobs(keywords);
    } catch (err) {
        console.error("Resume parsing or job scraping failed:", err.message);
    }
};

const fetchResume = async (req, res) => {
    try {
        const resumes = await Resumedata.find();
        res.status(200).json(resumes);
    } catch (error) {
        console.error("Error fetching resumes:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
    }

export { uploadResume, fetchResume };
