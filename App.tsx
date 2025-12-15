
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Home from './routes/Home';
import Inbox from './routes/Inbox';
import Appointments from './routes/Appointments';
import Classes from './routes/Classes';
import Clients from './routes/Clients';
import Settings from './routes/Settings';
import Login from './routes/Login';
import { mockApi } from './services/mockApi';
import { BusinessSettings } from './types';

interface AuthUser {
  name: string;
  email: string;
}

const App: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Check for existing session
    const auth = localStorage.getItem('conversia_auth');
    const savedUser = localStorage.getItem('conversia_user');

    if (auth === 'true') {
      setIsAuthenticated(true);
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Failed to parse user", e);
        }
      }
    }
    
    // Load settings in background
    mockApi.getSettings().then(setSettings);
    setIsLoadingAuth(false);
  }, []);

  const handleLogin = (user: AuthUser) => {
    localStorage.setItem('conversia_auth', 'true');
    localStorage.setItem('conversia_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    // Refresh settings in case it was a signup that updated them
    mockApi.getSettings().then(setSettings);
  };

  const handleLogout = () => {
    localStorage.removeItem('conversia_auth');
    localStorage.removeItem('conversia_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (isLoadingAuth) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-400">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
        <Sidebar onLogout={handleLogout} user={currentUser} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar settings={settings} />
          <main className="flex-1 overflow-hidden relative">
            <Routes>
              <Route path="/" element={<Home user={currentUser} />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
