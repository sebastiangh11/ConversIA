import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle, Smartphone, Mail, ShieldCheck } from 'lucide-react';
import { mockApi } from '../services/mockApi';

const VerifyResetCode: React.FC = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const identifier = sessionStorage.getItem('reset_identifier');
  const requestId = sessionStorage.getItem('reset_request_id');
  const deliveryMethod = sessionStorage.getItem('reset_delivery_method') || 'email';

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!identifier || !requestId) {
    return <Navigate to="/reset/request" replace />;
  }

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    pastedData.split('').forEach((char, i) => {
      newCode[i] = char;
    });
    setCode(newCode);
    inputs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) return;

    setIsLoading(true);
    setError('');

    try {
      const { resetToken } = await mockApi.verifyResetCode({ 
        requestId, 
        code: fullCode,
        identifier 
      });
      sessionStorage.setItem('reset_token', resetToken);
      navigate('/reset/new');
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      const response = await mockApi.requestPasswordReset({ 
        identifier, 
        deliveryMethod: deliveryMethod as any 
      });
      sessionStorage.setItem('reset_request_id', response.requestId);
      setResendTimer(30);
      setCode(['', '', '', '', '', '']);
      setError('');
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const maskIdentifier = (str: string) => {
    if (deliveryMethod === 'email') {
      const [user, domain] = str.split('@');
      return `${user[0]}***@${domain}`;
    }
    return str.slice(-4).padStart(str.length, '*');
  };

  const isCodeComplete = code.every(digit => digit !== '');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <ShieldCheck size={24} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Verify Code</h2>
        <p className="mt-2 text-sm text-gray-500 font-medium px-4">
          We sent a code to <span className="font-bold text-gray-900">{maskIdentifier(identifier)}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[440px]">
        <div className="bg-white py-10 px-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 sm:rounded-[2.5rem] sm:px-10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full opacity-50 blur-3xl"></div>
          
          <div className="flex justify-center gap-2 mb-8 relative">
            <div className="h-1.5 w-12 rounded-full bg-indigo-600"></div>
            <div className="h-1.5 w-12 rounded-full bg-indigo-600"></div>
            <div className="h-1.5 w-12 rounded-full bg-gray-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex justify-between gap-2 mb-6">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  // Fix: Wrapped in braces to ensure the ref callback returns void instead of the element instance
                  ref={(el) => { inputs.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 transition-all outline-none
                    ${error 
                      ? 'border-rose-300 bg-rose-50 text-rose-900' 
                      : digit 
                        ? 'border-gray-300 bg-white text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50' 
                        : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`}
                />
              ))}
            </div>

            {error && <p className="mb-6 text-center text-xs text-rose-600 font-bold bg-rose-50 py-2 rounded-lg border border-rose-100 animate-in fade-in slide-in-from-top-1">{error}</p>}

            <button
              type="submit"
              disabled={isLoading || !isCodeComplete}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-indigo-100 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed items-center gap-3 transform active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Code'}
            </button>

            <div className="mt-8 text-center space-y-4">
              <p className="text-xs text-gray-500 font-bold">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || isLoading}
                  className={`text-indigo-600 font-black uppercase tracking-tighter hover:underline disabled:text-gray-300 disabled:no-underline`}
                >
                  Resend {resendTimer > 0 ? `(${resendTimer}s)` : ''}
                </button>
              </p>
              
              <Link to="/reset/request" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">
                <ArrowLeft size={14} /> Back
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetCode;