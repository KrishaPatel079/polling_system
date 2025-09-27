// frontend/src/components/Polls/PollCard.jsx
import React from 'react';
import { Clock, Users, BarChart3, CheckCircle } from 'lucide-react';

const PollCard = ({ poll, onSelect, hasVoted }) => {
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const createdDate = new Date(poll.createdAt).toLocaleDateString();

  return (
    <div
      onClick={() => onSelect(poll)}
      className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {poll.title}
          </h3>
          {poll.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {poll.description}
            </p>
          )}
        </div>
        
        <div className="ml-4 flex items-center space-x-2">
          {hasVoted && (
            <div className="flex items-center text-green-600" title="You have voted">
              <CheckCircle className="h-5 w-5" />
            </div>
          )}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            poll.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {poll.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {poll.options.slice(0, 3).map((option, index) => {
          const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0;
          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate flex-1 mr-2">
                {option.text}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">{option.votes}</span>
                <div className="w-12 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
        
        {poll.options.length > 3 && (
          <div className="text-xs text-gray-500">
            +{poll.options.length - 3} more option{poll.options.length - 3 !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <BarChart3 className="h-4 w-4" />
            <span>{poll.options.length} option{poll.options.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4" />
          <span>{createdDate}</span>
        </div>
      </div>
    </div>
  );
};

export default PollCard;