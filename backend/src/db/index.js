import mongoose from "mongoose"
// import {ApiError} from "../utils/ApiError.js"

const dbConnect = async () =>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`)
    } catch (error) {
        console.log("An unexpected error occured while connecting to Database. Error:-",error);
    }
}

export default dbConnect