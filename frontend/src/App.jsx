import { Routes, Route, Link } from 'react-router-dom';
import ResumeUpload from './components/resumeUpload';
import InternshalaJobs from './components/InternshalaJobs';
import GlassdoorJobs from './components/GlassdoorJobs';

function App() {
  return (
    <>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', marginBottom: '2rem' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
        <Link to="/internshala" style={{ marginRight: '1rem' }}>Internshala Jobs</Link>
        <Link to="/glassdoor">Glassdoor Jobs</Link>
      </nav>
      <Routes>
        <Route path="/" element={<ResumeUpload />} />
        <Route path="/internshala" element={<InternshalaJobs />} />
        <Route path="/glassdoor" element={<GlassdoorJobs />} />
      </Routes>
    </>
  );
}

export default App;
