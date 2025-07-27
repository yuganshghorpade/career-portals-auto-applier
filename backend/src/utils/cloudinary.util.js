import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import {ApiError} from "./ApiError.js";
import { ApiResponse } from "./ApiResponse.js";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View Credentials' below to copy your API secret
});

const uploadOncloudinary = async (localFilePath)=>{
    try {

        if (!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        fs.unlinkSync(localFilePath)
        
        return new ApiResponse(
            200,
            response,
            "File uploaded successfully"
        )
    } catch (error) {
        throw new ApiError(505,`An unexpected error occured while uploading the file on cloudinary. Error:-${error}`)
    }
}

export default uploadOncloudinary