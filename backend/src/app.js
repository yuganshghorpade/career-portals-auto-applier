// import express from "express";
// import cookieparser from 'cookie-parser'
// import cors from 'cors'
// import resumeRoutes from './routes/resume.js';
// import internshalaRoutes from './routes/internshala.js';
// import glassdoorRoutes from './routes/glassdoor.js';

// const app = express();
// app.use(cors({
//     origin:'https://career-portals-auto-applier.vercel.app',
//     credentials:true
// }))
// app.use(express.json({limit:"16kb"}))
// app.use(express.urlencoded({extended:true,limit:"16kb"}))
// app.use(express.static("public"))
// app.use(cookieparser())


// app.use('/api/v1/resume', resumeRoutes);
// app.use('/api/v1/internshala', internshalaRoutes);
// app.use('/api/v1/glassdoor', glassdoorRoutes);

// export {app}

import express from "express";
import cookieparser from 'cookie-parser'
import cors from 'cors'
import resumeRoutes from './routes/resume.js';
import internshalaRoutes from './routes/internshala.js';
import glassdoorRoutes from './routes/glassdoor.js';

const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: ['https://career-portals-auto-applier.vercel.app', 'http://localhost:5173'], // Add localhost for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
// app.options('*', cors({
//     origin: ['https://career-portals-auto-applier.vercel.app', 'http://localhost:5173'],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieparser())

app.use('/api/v1/resume', resumeRoutes);
app.use('/api/v1/internshala', internshalaRoutes);
app.use('/api/v1/glassdoor', glassdoorRoutes);

export {app}