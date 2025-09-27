// frontend/src/components/Polls/PollList.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import PollCard from './PollCard';
import { pollAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const PollList = ({ onSelectPoll, votedPolls = [] }) => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, mostVotes
  
  const { user } = useAuth();

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      const response = await pollAPI.getPolls();
      
      // Ensure we have a valid response with polls array
      if (response && response.data) {
        // Handle different possible response structures
        let pollsData;
        if (Array.isArray(response.data)) {
          pollsData = response.data;
        } else if (response.data.polls && Array.isArray(response.data.polls)) {
          pollsData = response.data.polls;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          pollsData = response.data.data;
        } else {
          pollsData = [];
        }
        
        setPolls(pollsData);
      } else {
        setPolls([]);
        setError('No data received from server');
      }
    } catch (err) {
      console.error('Error fetching polls:', err);
      setPolls([]); // Ensure polls is always an array
      
      // Set more specific error messages
      if (err.code === 'ERR_NETWORK' || err.message.includes('ERR_CONNECTION_REFUSED')) {
        setError('Unable to connect to the server. Please make sure the backend is running.');
      } else if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch polls');
      }
    } finally {
      setLoading(false);
    }
  };

  // Ensure polls is always an array before filtering
  const safePolls = Array.isArray(polls) ? polls : [];

  // Filter and sort polls
  const filteredPolls = safePolls
    .filter(poll => {
      // Ensure poll object has required properties
      if (!poll || typeof poll !== 'object') {
        return false;
      }

      // Search filter
      const title = poll.title || '';
      const description = poll.description || '';
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const isActive = poll.isActive !== false; // Default to true if not specified
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && isActive) ||
                           (filterStatus === 'inactive' && !isActive);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          const aDate = new Date(a.createdAt || 0);
          const bDate = new Date(b.createdAt || 0);
          return aDate - bDate;
        case 'mostVotes':
          const aVotes = (a.options || []).reduce((sum, opt) => sum + (opt.votes || 0), 0);
          const bVotes = (b.options || []).reduce((sum, opt) => sum + (opt.votes || 0), 0);
          return bVotes - aVotes;
        case 'newest':
        default:
          const aDateNew = new Date(a.createdAt || 0);
          const bDateNew = new Date(b.createdAt || 0);
          return bDateNew - aDateNew;
      }
    });

  const handleRefresh = () => {
    fetchPolls();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading polls...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">All Polls</h1>
          <p className="text-gray-600">
            {filteredPolls.length} poll{filteredPolls.length !== 1 ? 's' : ''} available
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search polls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="mostVotes">Most Votes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
              <div className="mt-1 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-2">
                <button
                  onClick={handleRefresh}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Polls Grid */}
      {filteredPolls.length === 0 && !error ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' 
              ? 'No polls match your criteria' 
              : 'No polls available'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter settings.'
              : user?.role === 'admin' 
                ? 'Create your first poll to get started!'
                : 'Check back later for new polls.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.map((poll) => (
            <PollCard
              key={poll._id || poll.id}
              poll={poll}
              onSelect={onSelectPoll}
              hasVoted={votedPolls.includes(poll._id || poll.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PollList;