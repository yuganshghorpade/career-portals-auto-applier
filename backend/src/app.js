import express from "express";
import cookieparser from 'cookie-parser'
import cors from 'cors'
import resumeRoutes from './routes/resume.js';
import internshalaRoutes from './routes/internshala.js';
import glassdoorRoutes from './routes/glassdoor.js';

const app = express();
app.use(cors({
    origin:'http://localhost:5173',
    credentials:true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieparser())


app.use('/api/v1/resume', resumeRoutes);
app.use('/api/v1/internshala', internshalaRoutes);
app.use('/api/v1/glassdoor', glassdoorRoutes);

export {app}