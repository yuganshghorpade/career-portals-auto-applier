import { app } from "./app.js";
import dotenv from 'dotenv'
import dbConnect from "./db/index.js";

dotenv.config({
    path:'../.env'
})

dbConnect()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log("Server is running at port ",process.env.PORT);
    })
})
.catch((err)=>{
    console.log("Mongo Db connection failed !!! ",err);
})