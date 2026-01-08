
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Home from './routes/Home';
import Inbox from './routes/Inbox';
import Appointments from './routes/Appointments';
import Classes from './routes/Classes';
import Clients from './routes/Clients';
import Payments from './routes/Payments';
import Settings from './routes/Settings';
import Login from './routes/Login';
import SignupFlow from './routes/SignupFlow';
import ForgotPassword from './routes/ForgotPassword';
import VerifyResetCode from './routes/VerifyResetCode';
import NewPassword from './routes/NewPassword';
import { mockApi } from './services/mockApi';
import { BusinessSettings } from './types';

interface AuthUser {
  name: string;
  email: string;
}

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  user: AuthUser | null;
  settings: BusinessSettings | null;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children, onLogout, user, settings }) => (
  <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
    <Sidebar onLogout={onLogout} user={user} />
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Topbar settings={settings} />
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  </div>
);

const App: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
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
    
    mockApi.getSettings().then(setSettings);
    setIsLoadingAuth(false);
  }, []);

  const handleAuthSuccess = (user: AuthUser) => {
    localStorage.setItem('conversia_auth', 'true');
    localStorage.setItem('conversia_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
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

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleAuthSuccess} /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!isAuthenticated ? <SignupFlow onSignup={handleAuthSuccess} /> : <Navigate to="/" replace />} />
        
        <Route path="/reset/request" element={<ForgotPassword />} />
        <Route path="/reset/verify" element={<VerifyResetCode />} />
        <Route path="/reset/new" element={<NewPassword />} />
        <Route path="/forgot-password" element={<Navigate to="/reset/request" replace />} />

        <Route path="/" element={isAuthenticated ? <AuthenticatedLayout onLogout={handleLogout} user={currentUser} settings={settings}><Home user={currentUser} /></AuthenticatedLayout> : <Navigate to="/login" replace />} />
        <Route path="/inbox" element={isAuthenticated ? <AuthenticatedLayout onLogout={handleLogout} user={currentUser} settings={settings}><Inbox /></AuthenticatedLayout> : <Navigate to="/login" replace />} />
        <Route path="/appointments" element={isAuthenticated ? <AuthenticatedLayout onLogout={handleLogout} user={currentUser} settings={settings}><Appointments /></AuthenticatedLayout> : <Navigate to="/login" replace />} />
        <Route path="/classes" element={isAuthenticated ? <AuthenticatedLayout onLogout={handleLogout} user={currentUser} settings={settings}><Classes /></AuthenticatedLayout> : <Navigate to="/login" replace />} />
        <Route path="/clients" element={isAuthenticated ? <AuthenticatedLayout onLogout={handleLogout} user={currentUser} settings={settings}><Clients /></AuthenticatedLayout> : <Navigate to="/login" replace />} />
        <Route path="/payments" element={isAuthenticated ? <AuthenticatedLayout onLogout={handleLogout} user={currentUser} settings={settings}><Payments /></AuthenticatedLayout> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={isAuthenticated ? <AuthenticatedLayout onLogout={handleLogout} user={currentUser} settings={settings}><Settings /></AuthenticatedLayout> : <Navigate to="/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
