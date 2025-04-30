import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Events from './Events';
import Profile from './Profile';
import LeftNav from './LeftNav';
import CreateEvent from './CreateEvent';
import Signup from './Signup';
import NotificationBar from './NotificationBar';
import Chat from './Chat';
import UserProfile from './UserProfile';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/" />;
};

const AppContent = () => {
  const [isNavOpen, setIsNavOpen] = useState(true);
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen">
      {isAuthenticated && <LeftNav isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />}
      <div className={`flex-1 ${isAuthenticated ? 'ml-64' : ''}`}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Events /></PrivateRoute>} />
          <Route path="/create-event" element={<PrivateRoute><CreateEvent /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/profile/:userId" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      {isAuthenticated && <NotificationBar />}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
