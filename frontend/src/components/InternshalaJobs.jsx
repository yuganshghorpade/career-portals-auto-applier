import React, { useEffect, useState } from 'react';

const InternshalaJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8000/api/v1/internshala/jobs');
        // console.log(res);
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.log(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Internshala Job Openings</h2>
      {loading && <p>Loading jobs, please wait...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && jobs.length === 0 && <p>No jobs found.</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {jobs.map((job, idx) => (
          <div key={idx} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', width: '300px' }}>
            <h3>{job.title || 'No Title'}</h3>
            <p><strong>Company:</strong> {job.company || 'N/A'}</p>
            <p><strong>Location:</strong> {job.location || 'N/A'}</p>
            <p><strong>Stipend:</strong> {job.stipend || 'N/A'}</p>
            <p><strong>Apply By:</strong> {job.applyBy || 'N/A'}</p>
            {job.link ? (
              <a
                href={job.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#007bff',
                  color: '#fff',
                  borderRadius: '4px',
                  textDecoration: 'none'
                }}
              >
                Apply / View Details
              </a>
            ) : (
              <span style={{ color: 'gray' }}>No apply link available</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternshalaJobs;