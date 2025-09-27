// frontend/src/components/Polls/VoteButton.jsx
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { pollAPI } from '../../services/api';

const VoteButton = ({ poll, option, onVoteSuccess, hasVoted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVote = async () => {
    if (hasVoted || loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await pollAPI.vote(poll._id, option._id);
      if (onVoteSuccess) {
        onVoteSuccess(response.data.poll);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to vote');
      setTimeout(() => setError(''), 3000);
    }

    setLoading(false);
  };

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
  const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0;

  return (
    <div className="mb-3">
      <button
        onClick={handleVote}
        disabled={hasVoted || loading || !poll.isActive}
        className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
          hasVoted
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : poll.isActive
            ? 'border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 cursor-pointer'
            : 'border-gray-200 bg-gray-50 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900">
                {option.text}
              </span>
              {hasVoted && (
                <Check className="h-4 w-4 text-green-600 ml-2" />
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{option.votes} vote{option.votes !== 1 ? 's' : ''}</span>
                <span>{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    hasVoted ? 'bg-blue-600' : 'bg-blue-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {loading && (
            <div className="ml-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoteButton;