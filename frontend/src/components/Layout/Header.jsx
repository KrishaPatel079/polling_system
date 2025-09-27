// frontend/src/components/Layout/Header.jsx
import React from 'react';
import { LogOut, User, Plus, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ activeTab, setActiveTab }) => {
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Polling System
              </h1>
            </div>
          </div>

          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('polls')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'polls'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Polls
            </button>
            
            {isAdmin() && (
              <button
                onClick={() => setActiveTab('create')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${
                  activeTab === 'create'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Create Poll</span>
              </button>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <User className="h-4 w-4" />
              <span>{user?.name}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                user?.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {user?.role}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;