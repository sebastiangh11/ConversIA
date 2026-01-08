
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, Sparkles, Send } from 'lucide-react';
import { mockApi } from '../services/mockApi';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await mockApi.requestPasswordReset({ 
        identifier: email, 
        deliveryMethod: 'email' 
      });
      
      // Persist state for step 2
      sessionStorage.setItem('reset_identifier', email);
      sessionStorage.setItem('reset_request_id', response.requestId);
      sessionStorage.setItem('reset_delivery_method', 'email');
      
      navigate('/reset/verify');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 transform -rotate-3">
            <Sparkles size={24} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Reset Password</h2>
        <p className="mt-2 text-sm text-gray-500 font-medium px-4">
          We'll send you a link to get back into your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[440px]">
        <div className="bg-white py-10 px-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 sm:rounded-[2.5rem] sm:px-10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full opacity-50 blur-3xl"></div>
          
          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mb-8 relative">
            <div className="h-1.5 w-12 rounded-full bg-indigo-600"></div>
            <div className="h-1.5 w-12 rounded-full bg-gray-100"></div>
            <div className="h-1.5 w-12 rounded-full bg-gray-100"></div>
          </div>

          <form className="space-y-6 relative" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${error ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-indigo-500'} transition-colors`} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className={`block w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 rounded-2xl text-sm transition-all duration-200 focus:outline-none focus:bg-white
                    ${error ? 'border-rose-100 focus:border-rose-400 text-rose-900' : 'border-transparent focus:border-indigo-500 text-gray-900'}`}
                  placeholder="name@company.com"
                />
              </div>
              {error && <p className="mt-2 text-xs text-rose-500 font-bold flex items-center gap-1"> {error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-indigo-100 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed items-center gap-3 transform active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Send Reset Link</>}
            </button>

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
