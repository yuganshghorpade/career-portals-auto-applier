import { Routes, Route, Link } from 'react-router-dom';
import ResumeUpload from './components/resumeUpload';
import InternshalaJobs from './components/InternshalaJobs';
import GlassdoorJobs from './components/GlassdoorJobs';
import Tracker from './components/Tracker';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<ResumeUpload />} />
        <Route path="/internshala" element={<InternshalaJobs />} />
        <Route path="/glassdoor" element={<GlassdoorJobs />} />
        <Route path="/tracker" element={<Tracker/>} />
      </Routes>
    </>
  );
}

export default App;
