import React, { useState, useEffect } from 'react';
import { Mail, Clock, User, MessageSquare, Eye, Check, X, Search, Filter } from 'lucide-react';

const AdminContactPanel = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    inquiryType: 'all',
    page: 1
  });
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Fetch contact submissions
  const fetchSubmissions = async () => {
    try {
      const query = new URLSearchParams({
        page: filters.page,
        limit: 10,
        status: filters.status,
        inquiryType: filters.inquiryType
      });

      const response = await fetch(`http://localhost:4000/contact/submissions?${query}`);
      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contact statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/contact/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Update submission status
  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:4000/contact/submission/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        fetchSubmissions();
        if (selectedSubmission && selectedSubmission._id === id) {
          setSelectedSubmission(data.submission);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // View submission details
  const viewSubmission = async (id) => {
    try {
      const response = await fetch(`http://localhost:4000/contact/submission/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedSubmission(data.submission);
        fetchSubmissions(); // Refresh to update read status
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchStats();
  }, [filters]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-yellow-100 text-yellow-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'resolved': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInquiryTypeIcon = (type) => {
    switch (type) {
      case 'general': return <MessageSquare className="w-4 h-4" />;
      case 'support': return <User className="w-4 h-4" />;
      case 'business': return <Mail className="w-4 h-4" />;
      case 'feedback': return <Eye className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contact submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Contact Management</h1>
          <p className="text-gray-600 mt-1">Manage customer inquiries and support requests</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">New Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newSubmissions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolvedSubmissions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalSubmissions > 0 
                    ? Math.round((stats.resolvedSubmissions / stats.totalSubmissions) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submissions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
                  
                  {/* Filters */}
                  <div className="flex gap-2">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    
                    <select
                      value={filters.inquiryType}
                      onChange={(e) => setFilters({...filters, inquiryType: e.target.value, page: 1})}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="general">General</option>
                      <option value="support">Support</option>
                      <option value="business">Business</option>
                      <option value="feedback">Feedback</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="divide-y">
                {submissions.map((submission) => (
                  <div
                    key={submission._id}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedSubmission?._id === submission._id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => viewSubmission(submission._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getInquiryTypeIcon(submission.inquiryType)}
                          <h3 className="font-medium text-gray-900">{submission.subject}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {submission.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {submission.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {submission.message}
                        </p>
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(submission._id, 'replied');
                          }}
                          className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-md hover:bg-green-200 transition-colors"
                        >
                          Mark Replied
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(submission._id, 'resolved');
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {submissions.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No submissions found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submission Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Submission Details</h2>
              </div>
              
              {selectedSubmission ? (
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`inline-flex px-3 py-1 text-sm rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                        {selectedSubmission.status}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <p className="text-sm text-gray-900">{selectedSubmission.name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-sm text-gray-900">
                        <a href={`mailto:${selectedSubmission.email}`} className="text-blue-600 hover:underline">
                          {selectedSubmission.email}
                        </a>
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <p className="text-sm text-gray-900">{selectedSubmission.subject}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inquiry Type</label>
                      <div className="flex items-center gap-2">
                        {getInquiryTypeIcon(selectedSubmission.inquiryType)}
                        <span className="text-sm text-gray-900 capitalize">{selectedSubmission.inquiryType}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedSubmission.message}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedSubmission.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    {selectedSubmission.repliedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Replied</label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedSubmission.repliedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    <button
                      onClick={() => updateStatus(selectedSubmission._id, 'replied')}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Mark as Replied
                    </button>
                    
                    <button
                      onClick={() => updateStatus(selectedSubmission._id, 'resolved')}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Mark as Resolved
                    </button>
                    
                    <button
                      onClick={() => window.open(`mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Reply via Email
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Select a submission to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContactPanel;