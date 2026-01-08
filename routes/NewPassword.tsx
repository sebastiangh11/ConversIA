
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, Sparkles, Eye, EyeOff, XCircle, ShieldCheck } from 'lucide-react';
import { mockApi } from '../services/mockApi';

const ValidationItem = ({ fulfilled, text }: { fulfilled: boolean; text: string }) => (
  <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${fulfilled ? 'text-green-600' : 'text-gray-400'}`}>
    {fulfilled ? <CheckCircle size={14} className="text-green-500 shrink-0" /> : <XCircle size={14} className="text-gray-300 shrink-0" />}
    <span className={fulfilled ? 'font-semibold' : ''}>{text}</span>
  </div>
);

const NewPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const resetToken = sessionStorage.getItem('reset_token');

  const criteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  if (!resetToken && !isSuccess) {
    return <Navigate to="/reset/request" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Object.values(criteria).every(Boolean)) {
      setError('Password does not meet requirements');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await mockApi.updatePassword({ resetToken: resetToken!, newPassword: password });
      setIsSuccess(true);
      // Clear flow state
      sessionStorage.clear();
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="bg-white py-10 px-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 sm:rounded-[2.5rem] sm:px-10 space-y-8 animate-in zoom-in duration-500">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center shadow-inner">
                <CheckCircle size={40} />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Password Updated</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Your identity has been verified and your password is now secured. You can now use your new credentials to sign in.</p>
            </div>
            <Link to="/login" className="w-full inline-flex justify-center py-4 px-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 transform active:scale-[0.98]">
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Lock size={24} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">New Password</h2>
        <p className="mt-2 text-sm text-gray-500 font-medium px-4">Create a secure password you haven't used before</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[440px]">
        <div className="bg-white py-10 px-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 sm:rounded-[2.5rem] sm:px-10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full opacity-50 blur-3xl"></div>
          
          <div className="flex justify-center gap-2 mb-8 relative">
            <div className="h-1.5 w-12 rounded-full bg-indigo-600"></div>
            <div className="h-1.5 w-12 rounded-full bg-indigo-600"></div>
            <div className="h-1.5 w-12 rounded-full bg-indigo-600"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${error && error.includes('requirements') ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-indigo-500'}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="block w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-indigo-500 text-gray-900 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Confirm New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${error && error.includes('match') ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-indigo-500'}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  className="block w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-indigo-500 text-gray-900 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <ValidationItem fulfilled={criteria.length} text="At least 8 characters" />
              <ValidationItem fulfilled={criteria.upper} text="At least 1 uppercase letter" />
              <ValidationItem fulfilled={criteria.lower} text="At least 1 lowercase letter" />
              <ValidationItem fulfilled={criteria.number} text="At least 1 number" />
              <ValidationItem fulfilled={criteria.special} text="At least 1 special character" />
            </div>

            {error && <p className="text-xs text-rose-500 font-bold flex items-center gap-1 animate-pulse"><XCircle size={14} /> {error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-indigo-100 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all transform active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPassword;
