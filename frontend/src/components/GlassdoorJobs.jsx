import React, { useEffect, useState } from 'react';

const GlassdoorJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8000/api/v1/glassdoor/jobs');
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const data = await res.json();
        setJobs(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Glassdoor Job Openings</h2>
      {loading && <p>Loading jobs, please wait...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && jobs.length === 0 && <p>No jobs found.</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {jobs.map((job, idx) => (
          <div key={idx} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', width: '300px' }}>
            <h3>{job.title}</h3>
            <p><strong>Company:</strong> {job.company}</p>
            <p><strong>Location:</strong> {job.location}</p>
            {job.link && <a href={job.link} target="_blank" rel="noopener noreferrer">View Details</a>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlassdoorJobs; 