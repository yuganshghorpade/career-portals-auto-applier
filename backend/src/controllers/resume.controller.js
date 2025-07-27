import uploadOncloudinary from "../utils/cloudinary.util.js";
import docxParser from "docx-parser";
import path from "path";
import { parseResumeWithGemini } from "../utils/resumeparser.util.js";

const uploadResume = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    let rdata = "";
    // console.log(req.file);
    const resumeLocalPath = req.file.path;

    // If the file is a .docx, read and log its content
    if (path.extname(req.file.originalname).toLowerCase() === ".docx") {
    rdata = await new Promise((resolve, reject) => {
        docxParser.parseDocx(resumeLocalPath, (data) => {
            if (!data) return reject(new Error("DOCX parsing failed"));
            // console.log("Extracted DOCX content:\n", data);
            resolve(data);
        });
    });
}


    try {
        const resumeData = await parseResumeWithGemini(rdata);
        console.log("🎯 Parsed Resume Data:", resumeData);

        // You can now pass resumeData to the job search module
    } catch (err) {
        console.error("Resume parsing failed:", err.message);
    }

    const resume = await uploadOncloudinary(resumeLocalPath);
    if (!resume.data.url) {
        throw new ApiError(400, "Error while uploading image");
    }
    let resumeUrl = resume.data.url;
    res.status(200).json({
        image: resumeUrl,
        message: "Resume uploaded successfully",
        filePath: `/temp/${req.file.filename}`,
        originalName: req.file.originalname,
    });
};

export { uploadResume };
