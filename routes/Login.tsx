
import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, Loader2, User, Store, Smartphone, AlertCircle, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { mockApi } from '../services/mockApi';

interface LoginProps {
  onLogin: (user: { name: string; email: string }) => void;
}

const ValidationItem = ({ fulfilled, text }: { fulfilled: boolean; text: string }) => (
  <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${fulfilled ? 'text-green-600' : 'text-gray-400'}`}>
    {fulfilled ? (
      <CheckCircle size={14} className="text-green-500 shrink-0" />
    ) : (
      <XCircle size={14} className="text-gray-300 shrink-0" />
    )}
    <span className={fulfilled ? 'font-semibold' : ''}>{text}</span>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);

  // Password Validation State
  const [criteria, setCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });
  
  useEffect(() => {
    setCriteria({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Email Validation
    if (!email) {
       newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
       newErrors.email = "Email is invalid";
    }
    
    if (!isLogin) {
        // Sign Up Validation
        if (!name) newErrors.name = "Full name is required";
        if (!businessName) newErrors.businessName = "Business name is required";
        
        if (!whatsappNumber) {
            newErrors.whatsappNumber = "Business number is required";
        } else if (!/^\+?[\d\s-]{10,}$/.test(whatsappNumber)) {
            newErrors.whatsappNumber = "Please enter a valid phone number";
        }

        // Strict Password Validation for Sign Up
        const allCriteriaMet = Object.values(criteria).every(Boolean);
        if (!allCriteriaMet) {
            newErrors.password = "Password does not meet requirements";
        }
        
        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }
    } else {
        // Login Validation
        if (!password) {
           newErrors.password = "Password is required";
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
        setShake(true);
        setTimeout(() => setShake(false), 300);
        return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(async () => {
      if (!isLogin) {
        await mockApi.updateSettings({
            name: businessName,
            whatsappNumber: whatsappNumber
        });
      }

      setIsLoading(false);
      
      onLogin({
        name: isLogin ? 'Business Owner' : name,
        email: email
      });

    }, 1500);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    // Simulate Google OAuth delay
    setTimeout(() => {
        setIsGoogleLoading(false);
        onLogin({
            name: 'Google User',
            email: 'user@gmail.com'
        });
    }, 1500);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
    setEmail(''); // Clear email too for clean switch
    setShake(false);
  };

  const getInputStyles = (hasError: boolean) => `
    block w-full pl-10 sm:text-sm border rounded-xl 
    focus:outline-none transition-all duration-200 py-3
    ${hasError 
        ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' 
        : 'border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500'
    }
  `;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 transform transition-transform hover:scale-105">
            <span className="font-bold text-2xl">C</span>
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {isLogin ? 'Welcome back' : 'Create Account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? 'Sign in to access your dashboard' : 'Setup your business in less than 2 minutes'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-100/50 border border-gray-100 sm:rounded-2xl sm:px-10 relative overflow-hidden">
          
          <form className={`space-y-5 ${shake ? 'animate-shake' : ''}`} onSubmit={handleSubmit} noValidate>
            
            {!isLogin && (
              <>
                <div className="animate-in slide-in-from-top-4 duration-300">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Full Name</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className={`h-5 w-5 ${errors.name ? 'text-red-400' : 'text-gray-400'}`} />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={getInputStyles(!!errors.name)}
                            placeholder="Sebastian Gomez"
                        />
                    </div>
                    {errors.name && <p className="mt-1 text-xs text-red-500 font-medium animate-pulse">{errors.name}</p>}
                </div>

                 <div className="animate-in slide-in-from-top-4 duration-300 delay-75">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Business Name</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Store className={`h-5 w-5 ${errors.businessName ? 'text-red-400' : 'text-gray-400'}`} />
                        </div>
                        <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className={getInputStyles(!!errors.businessName)}
                            placeholder="My Awesome Business"
                        />
                    </div>
                    {errors.businessName && <p className="mt-1 text-xs text-red-500 font-medium animate-pulse">{errors.businessName}</p>}
                </div>
                <div className="animate-in slide-in-from-top-4 duration-300 delay-100">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Number of the Business</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Smartphone className={`h-5 w-5 ${errors.whatsappNumber ? 'text-red-400' : 'text-gray-400'}`} />
                        </div>
                        <input
                            type="text"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            className={getInputStyles(!!errors.whatsappNumber)}
                            placeholder="+1 555 123 4567"
                        />
                    </div>
                    {errors.whatsappNumber && <p className="mt-1 text-xs text-red-500 font-medium animate-pulse">{errors.whatsappNumber}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={getInputStyles(!!errors.email)}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500 font-medium animate-pulse">{errors.email}</p>}
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Password
                </label>
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={getInputStyles(!!errors.password)}
                        placeholder="••••••••"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 ${errors.password ? 'text-red-400' : 'text-gray-400'}`}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                
                {!isLogin && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2 animate-in fade-in slide-in-from-top-2">
                         <ValidationItem fulfilled={criteria.length} text="At least 8 characters" />
                        <ValidationItem fulfilled={criteria.upper} text="At least 1 uppercase letter" />
                        <ValidationItem fulfilled={criteria.lower} text="At least 1 lowercase letter" />
                        <ValidationItem fulfilled={criteria.number} text="At least 1 number" />
                        <ValidationItem fulfilled={criteria.special} text="At least 1 special character" />
                    </div>
                )}
                
                {errors.password && isLogin && <p className="mt-1 text-xs text-red-500 font-medium animate-pulse">{errors.password}</p>}
            </div>

            {!isLogin && (
                <div className="animate-in slide-in-from-top-4 duration-300 delay-150">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Confirm Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className={`h-5 w-5 ${errors.confirmPassword ? 'text-red-400' : 'text-gray-400'}`} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={getInputStyles(!!errors.confirmPassword)}
                            placeholder="••••••••"
                        />
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-500 font-medium animate-pulse flex items-center gap-1"><XCircle size={10} /> {errors.confirmPassword}</p>}
                </div>
            )}
            
            {/* ALERT BOX */}
            {Object.keys(errors).length > 0 && (
               <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                 <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                 <div>
                    <h4 className="text-sm font-bold text-red-800">Validation Error</h4>
                    <p className="text-xs text-red-700 mt-0.5 font-medium">Please correct the errors highlighted above to continue.</p>
                 </div>
               </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-200 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed items-center gap-2 transform active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> {isLogin ? 'Signing in...' : 'Creating Account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign in' : 'Create Account'} <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70"
              >
                 {isGoogleLoading ? (
                    <Loader2 className="animate-spin text-gray-400" size={20} />
                 ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                        />
                        <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                        />
                        <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                        fill="#FBBC05"
                        />
                        <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                        />
                    </svg>
                 )}
                  {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
              </button>
            </div>
          </div>

          {/* Footer */}
           <div className="mt-6">
            <div className="mt-6">
              <button 
                type="button"
                onClick={toggleMode}
                className="w-full inline-flex justify-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-gray-50 text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all"
              >
                 {isLogin ? 'Create an account' : 'Log in'}
              </button>
            </div>
          </div>

        </div>
      </div>
      
      {/* CSS Animation for Shake */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default Login;
    