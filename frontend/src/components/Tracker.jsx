import React, { useEffect, useState } from "react";
import { 
  BarChart3, 
  Calendar, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ExternalLink,
  TrendingUp,
  Briefcase,
  Search,
  RefreshCw
} from "lucide-react";
import axios from "axios";

const Spinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-purple-200 rounded-full animate-spin"></div>
      <div className="absolute top-0 left-0 w-12 h-12 border-4 border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
    </div>
  </div>
);

const StatusIcon = ({ status }) => {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes("rejected") || statusLower.includes("declined")) {
    return <XCircle className="w-5 h-5 text-red-500" />;
  }
  if (statusLower.includes("hired") || statusLower.includes("accepted") || statusLower.includes("selected")) {
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  }
  if (statusLower.includes("interview") || statusLower.includes("review")) {
    return <AlertCircle className="w-5 h-5 text-blue-500" />;
  }
  return <Clock className="w-5 h-5 text-yellow-500" />;
};

const StatusBadge = ({ status }) => {
  const statusLower = status.toLowerCase();
  
  let bgColor = "bg-gray-100 text-gray-800";
  if (statusLower.includes("rejected") || statusLower.includes("declined")) {
    bgColor = "bg-red-100 text-red-800 border-red-200";
  } else if (statusLower.includes("hired") || statusLower.includes("accepted") || statusLower.includes("selected")) {
    bgColor = "bg-green-100 text-green-800 border-green-200";
  } else if (statusLower.includes("interview") || statusLower.includes("review")) {
    bgColor = "bg-blue-100 text-blue-800 border-blue-200";
  } else if (statusLower.includes("pending") || statusLower.includes("applied")) {
    bgColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${bgColor}`}>
      <StatusIcon status={status} />
      <span className="ml-2">{status}</span>
    </span>
  );
};

function Tracker() {
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState({ total: 0, scrapedAt: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(app => 
      app.status.toLowerCase().includes("pending") || 
      app.status.toLowerCase().includes("applied") ||
      app.status.toLowerCase().includes("under review")
    ).length;
    const interviews = applications.filter(app => 
      app.status.toLowerCase().includes("interview") ||
      app.status.toLowerCase().includes("shortlist") ||
      app.status.toLowerCase().includes("Response unlikely")
    ).length;
    const hired = applications.filter(app => 
      app.status.toLowerCase().includes("hired") ||
      // app.status.toLowerCase().includes("selected") ||
      app.status.toLowerCase().includes("accepted")
    ).length;
    const rejected = applications.filter(app => 
      app.status.toLowerCase().includes("rejected") ||
      app.status.toLowerCase().includes("declined") ||
      app.status.toLowerCase().includes("not selected")
    ).length;

    return { total, pending, interviews, hired, rejected };
  }, [applications]);

  useEffect(() => {
    async function fetchApplications() {
      try {
        // Mock API call - replace with your actual axios call
        const res = await axios.get("http://localhost:8000/api/v1/internshala/track");
        console.log("res",res)
        
        if (res.data && res.data.data) {
          setApplications(res.data.data.applications || []);
          setSummary({
            total: res.data.data.totalApplications || 0,
            scrapedAt: res.data.data.scrapedAt || ''
          });
        } else {
          setApplications([]);
        }
      } catch (err) {
        console.error("Failed to fetch application data:", err);
        setError(err.response?.data?.error || 'Failed to fetch application data.');
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    // Add your refresh logic here
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Application Tracker
          </h1>
          <p className="text-gray-600 text-lg">Monitor your job application status across career portals</p>
          
          {!loading && summary.total > 0 && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-white/20">
              <Clock className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">
                Last updated: {new Date(summary.scrapedAt).toLocaleString()}
              </span>
              <button
                onClick={refreshData}
                className="ml-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 text-lg font-medium mb-2">Failed to load applications</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refreshData}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">No applications found</p>
            <p className="text-gray-500">Start applying to jobs to see your application status here</p>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Interviews</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.interviews}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hired</p>
                    <p className="text-2xl font-bold text-green-600">{stats.hired}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Applications Grid */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800">Application Status</h2>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                  {applications.length} applications
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications.map((app, index) => (
                  <div
                    key={app.applicationId || index}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-purple-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800 line-clamp-2 flex-1 mr-2">
                        {app.title}
                      </h3>
                      <StatusIcon status={app.status} />
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm font-medium">{app.company}</span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm">{app.dateApplied}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <StatusBadge status={app.status} />
                    </div>

                    {app.reviewLink && app.reviewLink !== "NA" && (
                      <a
                        href={app.reviewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Application
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Tracker;

