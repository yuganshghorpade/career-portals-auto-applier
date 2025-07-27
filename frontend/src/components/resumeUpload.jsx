import React, { useState } from "react";
import axios from "axios";

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file.");
      return;
    }
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/v1/resume/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );
      setMessage(res.data.message);
      setUploadedFile(res.data.filePath);
    } catch (err) {
      setMessage(
        err.response?.data?.error || "Upload failed. Please try again."
      );
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Upload Your Resume</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
        <button type="submit" style={{ marginLeft: 10 }}>Upload</button>
      </form>
      {message && <p>{message}</p>}
      {uploadedFile && (
        <div>
          <p>Uploaded File:</p>
          <a href={`http://localhost:8000${uploadedFile}`} target="_blank" rel="noopener noreferrer">
            {uploadedFile}
          </a>
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;