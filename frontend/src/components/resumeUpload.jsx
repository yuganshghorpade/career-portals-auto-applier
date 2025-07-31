import React, { useState, useEffect } from "react";
import { Upload, FileText, Briefcase, Search, Zap, ExternalLink, Check, AlertCircle, BarChart3 } from "lucide-react";
import axios from "axios";


const Spinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-purple-200 rounded-full animate-spin"></div>
      <div className="absolute top-0 left-0 w-12 h-12 border-4 border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
    </div>
  </div>
);

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [jobsInternshala, setJobsInternshala] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [resume, setResume] = useState(null);
  const [selectedResumeObj, setSelectedResumeObj] = useState(null);
  const [autoApplyStatus, setAutoApplyStatus] = useState("");

  const fetchInternshalaJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:8000/api/v1/internshala/jobs",
        { keywords: resume },
        { withCredentials: true }
      );
      setJobsInternshala(Array.isArray(res.data.jobs) ? res.data.jobs : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoApplyInternshala = async () => {
    if (!selectedResumeObj) return;
    setAutoApplyStatus("");
    setLoading(true);
    try {
      console.log(selectedResumeObj.keywords);
      console.log(selectedResumeObj.localpath)
      const res = await axios.post(
        "http://localhost:8000/api/v1/internshala/auto-apply",
        {
          keywords: selectedResumeObj.keywords,
          localpath: selectedResumeObj.localpath,
          text: selectedResumeObj.body
        },
        { withCredentials: true }
      );
      setAutoApplyStatus(
        res.data && res.data.data
          ? `Auto-applied to ${res.data.data.applied} out of ${res.data.data.attempted} jobs.`
          : "Auto-apply completed."
      );
    } catch (err) {
      setAutoApplyStatus(
        err.response?.data?.error || "Auto-apply failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchGlassdoorJobs = async () => {
    console.log(jobsInternshala);
    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:8000/api/v1/glassdoor/jobs",
        { keywords: resume },
        { withCredentials: true }
      );
      setJobs(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      alert("Scraping Glassdoor failed.");
    } finally {
      setLoading(false);
    }
  };

  const fetchingEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v1/resume/fetch",
        { withCredentials: true }
      );
      setResumes(response.data);
    } catch (error) {
      console.error("error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchingEvents();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
    setUploadedFile(null);
    setJobs([]);
    setJobsInternshala([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    setLoading(true);
    setMessage("");
    setUploadedFile(null);
    setJobs([]);
    setJobsInternshala([]);

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
      fetchingEvents();
    } catch (err) {
      setMessage(
        err.response?.data?.error || "Upload failed. Please try again."
      );
      setJobs([]);
      setJobsInternshala([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackerNavigation = () => {
    window.location.href = '/tracker';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Navigation */}
        <div className="relative text-center mb-12">
          {/* Tracker Button - Positioned absolutely in top right */}
          <div className="absolute top-0 right-0">
            <button
              onClick={handleTrackerNavigation}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg text-xl"
            >
              <BarChart3 className="w-6 h-6 mr-2" />
              Application Tracker
            </button>
          </div>
          
          {/* Main Header Content */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Resume Job Matcher
          </h1>
          <p className="text-gray-600 text-lg">Upload your resume and discover perfect job opportunities</p>
        </div>

        {loading && <Spinner />}

        {/* Main Content Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Resume Selection Card */}
          {resumes.length > 0 && (
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">Select Your Resume</h2>
              </div>

              <div className="mb-16">
                <label htmlFor="resumeDropdown" className="block text-sm font-medium text-gray-700 mb-2">
                  Choose from uploaded resumes:
                </label>
                <select
                  id="resumeDropdown"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedResume = resumes.find((r) => r._id === selectedId);
                    if (selectedResume) {
                      setResume(selectedResume.keywords);
                      setSelectedResumeObj(selectedResume);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a resume
                  </option>
                  {resumes.map((resume) => (
                    <option key={resume._id} value={resume._id}>
                      {resume.resumename || resume.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  disabled={!resume || loading}
                  onClick={fetchInternshalaJobs}
                  className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Scrape Internshala
                </button>

                <button
                  disabled={!selectedResumeObj || loading}
                  onClick={handleAutoApplyInternshala}
                  className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Auto Apply
                </button>

                <button
                  disabled={!resume || loading}
                  onClick={fetchGlassdoorJobs}
                  className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Scrape Glassdoor
                </button>
              </div>

              {autoApplyStatus && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-green-800 font-medium">{autoApplyStatus}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Upload Resume</h2>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 10MB</p>
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !file}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Upload className="w-4 h-4 mr-2" />
                {loading ? "Uploading..." : "Upload Resume"}
              </button>
            </div>

            {message && !loading && (
              <div className={`mt-4 p-3 rounded-lg flex items-center ${
                message.includes('failed') || message.includes('error') 
                  ? 'bg-red-50 text-red-800 border border-red-200' 
                  : 'bg-green-50 text-green-800 border border-green-200'
              }`}>
                <AlertCircle className="w-4 h-4 mr-2" />
                <p className="text-sm">{message}</p>
              </div>
            )}

            {uploadedFile && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800 mb-2">✅ File uploaded successfully!</p>
                <a
                  href={`http://localhost:8000${uploadedFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View uploaded file
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Jobs Display */}
        <div className="space-y-8">
          {/* Glassdoor Jobs */}
          {jobs.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">Glassdoor Jobs</h2>
                <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {jobs.length} found
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {jobs.map((job, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-blue-200"
                  >
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                      {job.title || "No Title"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Company:</strong> {job.company || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Location:</strong> {job.location || "N/A"}
                    </p>
                    {job.link ? (
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Apply Now
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No apply link available</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internshala Jobs */}
          {jobsInternshala.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">Internshala Jobs</h2>
                <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                  {jobsInternshala.length} found
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {jobsInternshala.map((job, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-purple-200"
                  >
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                      {job.title || "No Title"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Company:</strong> {job.company || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Location:</strong> {job.location || "N/A"}
                    </p>
                    {job.link ? (
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Apply Now
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No apply link available</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeUpload;