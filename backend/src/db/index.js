import mongoose from "mongoose"
// import {ApiError} from "../utils/ApiError.js"

const dbConnect = async () =>{
    try {
        // const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`)
        console.log("Connected to Database");
    } catch (error) {
        // throw new Error(505,`An unexpected error occured while connecting to Database. Error:-${error}`)
        console.log("An unexpected error occured while connecting to Database. Error:-",error);
    }
}

export default dbConnect