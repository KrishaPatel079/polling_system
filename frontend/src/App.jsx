// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout/Layout';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import PollList from './components/Polls/PollList';
import PollDetail from './components/Polls/PollDetail';
import CreatePoll from './components/Polls/CreatePoll';

// Auth wrapper component
const AuthWrapper = ({ children }) => {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {authMode === 'login' ? (
          <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
        )}
      </>
    );
  }

  return children;
};

// Main app content component
const AppContent = () => {
  const [activeTab, setActiveTab] = useState('polls');
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [votedPolls, setVotedPolls] = useState([]); // Track voted polls
  const { user, isAdmin } = useAuth();

  // Load voted polls from localStorage
  useEffect(() => {
    if (user) {
      const storedVotes = localStorage.getItem(`votedPolls_${user.id}`);
      if (storedVotes) {
        try {
          setVotedPolls(JSON.parse(storedVotes));
        } catch (error) {
          console.error('Error parsing voted polls:', error);
        }
      }
    }
  }, [user]);

  // Save voted polls to localStorage
  const saveVotedPoll = (pollId) => {
    const updatedVotes = [...votedPolls, pollId];
    setVotedPolls(updatedVotes);
    if (user) {
      localStorage.setItem(`votedPolls_${user.id}`, JSON.stringify(updatedVotes));
    }
  };

  const handleSelectPoll = (poll) => {
    setSelectedPoll(poll);
  };

  const handleBackToPolls = () => {
    setSelectedPoll(null);
    setActiveTab('polls');
  };

  const handlePollCreated = (newPoll) => {
    // Switch to polls tab after creating a poll
    setActiveTab('polls');
  };

  const handleVoteSuccess = (pollId) => {
    saveVotedPoll(pollId);
  };

  const renderContent = () => {
    // If a poll is selected, show poll detail
    if (selectedPoll) {
      return (
        <PollDetail
          poll={selectedPoll}
          onBack={handleBackToPolls}
          hasVoted={votedPolls.includes(selectedPoll._id)}
          setHasVoted={(voted) => {
            if (voted) {
              handleVoteSuccess(selectedPoll._id);
            }
          }}
        />
      );
    }

    // Otherwise show based on active tab
    switch (activeTab) {
      case 'create':
        if (!isAdmin()) {
          setActiveTab('polls');
          return null;
        }
        return <CreatePoll onPollCreated={handlePollCreated} />;
      
      case 'polls':
      default:
        return (
          <PollList
            onSelectPoll={handleSelectPoll}
            votedPolls={votedPolls}
          />
        );
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <AuthWrapper>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthWrapper>
    </AuthProvider>
  );
}

export default App;