// frontend/src/components/Polls/PollDetail.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Users, BarChart3, PieChart } from 'lucide-react';
import VoteButton from './VoteButton';
import PollChart from '../Charts/PollChart';
import { useSocket } from '../../contexts/SocketContext';

const PollDetail = ({ poll, onBack, hasVoted, setHasVoted }) => {
  const [currentPoll, setCurrentPoll] = useState(poll);
  const [chartType, setChartType] = useState('bar');
  const { joinPoll, leavePoll, onVoteCast, offVoteCast } = useSocket();

  useEffect(() => {
    if (poll?._id) {
      joinPoll(poll._id);

      const handleVoteUpdate = (data) => {
        if (data.pollId === poll._id) {
          setCurrentPoll(prev => ({
            ...prev,
            options: data.options
          }));
        }
      };

      onVoteCast(handleVoteUpdate);

      return () => {
        leavePoll(poll._id);
        offVoteCast(handleVoteUpdate);
      };
    }
  }, [poll?._id, joinPoll, leavePoll, onVoteCast, offVoteCast]);

  const handleVoteSuccess = (updatedPoll) => {
    setCurrentPoll(updatedPoll);
    setHasVoted(true);
  };

  if (!currentPoll) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalVotes = currentPoll.options.reduce((sum, option) => sum + option.votes, 0);
  const createdDate = new Date(currentPoll.createdAt).toLocaleDateString();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Polls
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {currentPoll.title}
              </h1>
              {currentPoll.description && (
                <p className="text-gray-600 mb-4">
                  {currentPoll.description}
                </p>
              )}
            </div>
            
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentPoll.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {currentPoll.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Created: {createdDate}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{totalVotes} total vote{totalVotes !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-1">
              <BarChart3 className="h-4 w-4" />
              <span>{currentPoll.options.length} option{currentPoll.options.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voting Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {hasVoted ? 'Your Vote' : 'Cast Your Vote'}
          </h2>
          
          {!currentPoll.isActive && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              This poll is no longer active.
            </div>
          )}

          {hasVoted && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              You have already voted in this poll. Results are shown below.
            </div>
          )}
          
          <div className="space-y-3">
            {currentPoll.options.map((option) => (
              <VoteButton
                key={option._id}
                poll={currentPoll}
                option={option}
                onVoteSuccess={handleVoteSuccess}
                hasVoted={hasVoted}
              />
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Live Results
              </h2>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-2 rounded-md ${
                    chartType === 'bar'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Bar Chart"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType('pie')}
                  className={`p-2 rounded-md ${
                    chartType === 'pie'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Pie Chart"
                >
                  <PieChart className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {totalVotes > 0 ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {totalVotes}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Total Votes Cast
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No votes yet. Be the first to vote!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Chart Section */}
      {totalVotes > 0 && (
        <div className="mt-6">
          <PollChart poll={currentPoll} chartType={chartType} />
        </div>
      )}
    </div>
  );
};

export default PollDetail;