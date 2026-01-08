
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, User, Store, Smartphone, Globe, 
  ArrowRight, ArrowLeft, Loader2, CheckCircle2, 
  Clock, MapPin, Sparkles, Eye, EyeOff, XCircle
} from 'lucide-react';
import { mockApi } from '../services/mockApi';
import { WorkingHours } from '../types';
import BusinessHoursEditor from '../components/BusinessHoursEditor';

interface SignupFlowProps {
  onSignup: (user: { name: string; email: string }) => void;
}

const SignupFlow: React.FC<SignupFlowProps> = ({ onSignup }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Account Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');

  // Onboarding Data
  const [description, setDescription] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York');
  const [activePreset, setActivePreset] = useState<'9-5' | '10-7' | '8-4' | null>('9-5');
  
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { open: '09:00', close: '17:00', isOpen: true },
    tuesday: { open: '09:00', close: '17:00', isOpen: true },
    wednesday: { open: '09:00', close: '17:00', isOpen: true },
    thursday: { open: '09:00', close: '17:00', isOpen: true },
    friday: { open: '09:00', close: '17:00', isOpen: true },
    saturday: { open: '09:00', close: '17:00', isOpen: false },
    sunday: { open: '09:00', close: '17:00', isOpen: false },
  });

  // Password Validation Criteria
  const passwordCriteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const validateField = (field: string, value: string) => {
    let error = "";
    if (field === 'name' && !value) error = "What should we call you?";
    if (field === 'businessName' && !value) error = "Tell us your business name";
    if (field === 'email' && (!value || !value.includes('@'))) error = "Check your email address";
    if (field === 'password') {
       if (!passwordCriteria.length || !passwordCriteria.upper || !passwordCriteria.lower || !passwordCriteria.special) {
         error = "Please meet the security requirements below";
       }
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const validateStep1 = () => {
    const isNameValid = validateField('name', name);
    const isEmailValid = validateField('email', email);
    const isPasswordValid = validateField('password', password);
    const isBusinessValid = validateField('businessName', businessName);
    
    setTouched({ name: true, email: true, password: true, businessName: true });
    
    return isNameValid && isEmailValid && isPasswordValid && isBusinessValid;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStep(2);
    }
  };

  const handleGoogleSignup = () => {
    setIsGoogleLoading(true);
    // Mock Google Auth Flow for Signup
    setTimeout(() => {
      setName('Google Business Owner');
      setEmail('user@gmail.com');
      setBusinessName('My Google Business');
      setIsGoogleLoading(false);
      setStep(2);
    }, 1500);
  };

  const applyPreset = (preset: '9-5' | '10-7' | '8-4') => {
    setActivePreset(preset);
    const newHours = { ...workingHours };
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
    const weekend = ['saturday', 'sunday'] as const;
    
    let open = '09:00', close = '17:00';
    if (preset === '10-7') { open = '10:00'; close = '19:00'; }
    if (preset === '8-4') { open = '08:00'; close = '16:00'; }
    
    weekdays.forEach(d => {
      newHours[d] = { ...newHours[d], isOpen: true, open, close };
    });
    weekend.forEach(d => {
      newHours[d] = { ...newHours[d], isOpen: false };
    });
    setWorkingHours(newHours);
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // FIX: Added missing properties required by BusinessSettings interface: reminder24h, reminder1h, daysOff, aiPrompt
      await mockApi.updateSettings({
        name: businessName,
        description,
        whatsappNumber,
        timezone,
        concurrentSlots: 1, // Default during onboarding
        workingHours,
        reminder24h: true,
        reminder1h: true,
        daysOff: [],
        aiPrompt: `You are a professional and kind medical assistant for ${businessName}.`
      });
      onSignup({ name, email });
      navigate('/');
    } catch (err) {
      console.error("Setup failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = (hasError: boolean) => `
    w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-[1.5rem] 
    text-slate-900 placeholder-slate-400 font-bold text-sm
    transition-all duration-200 outline-none
    ${hasError 
      ? 'border-rose-200 bg-rose-50/30' 
      : 'border-slate-100 focus:border-indigo-600 focus:bg-white focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)]'
    }
    hover:bg-slate-100/80 focus:hover:bg-white
  `;

  const ValidationItem = ({ fulfilled, text }: { fulfilled: boolean; text: string }) => (
    <div className={`flex items-center gap-1.5 text-[10px] transition-colors duration-200 ${fulfilled ? 'text-emerald-600' : 'text-slate-400'}`}>
      {fulfilled ? (
        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
      ) : (
        <XCircle size={12} className="text-slate-300 shrink-0" />
      )}
      <span className={fulfilled ? 'font-bold' : 'font-medium'}>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 transform -rotate-6 hover:rotate-0 transition-transform">
            <Sparkles size={32} />
          </div>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
          {step === 1 ? 'Create account' : 'Business setup'}
        </h2>
        {step === 2 && (
          <p className="mt-2 text-sm text-slate-500 font-medium animate-in fade-in slide-in-from-top-2 duration-700">Almost there — let’s set up your business basics.</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className={`h-2 w-12 rounded-full transition-all duration-500 ${step === 1 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
          <div className={`h-2 w-12 rounded-full transition-all duration-500 ${step === 2 ? 'bg-indigo-600 shadow-sm shadow-indigo-100' : 'bg-slate-200'}`}></div>
        </div>
      </div>

      <div className={`mt-2 sm:mx-auto sm:w-full transition-all duration-500 ${step === 1 ? 'sm:max-w-md' : 'sm:max-w-5xl'}`}>
        <div className="bg-white py-12 px-8 shadow-[0_32px_80px_-16px_rgba(15,23,42,0.1)] border border-slate-100 sm:rounded-[3rem] sm:px-12 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-50 rounded-full opacity-40 blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-50 rounded-full opacity-40 blur-3xl"></div>

          {step === 1 && (
            <div className="space-y-7 relative animate-in slide-in-from-left duration-500">
              
              <button
                onClick={handleGoogleSignup}
                disabled={isGoogleLoading || isLoading}
                className="w-full py-4 px-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-3 text-sm font-black text-slate-700 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <Loader2 className="animate-spin text-indigo-600" size={20} />
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign up with Google
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                  <span className="px-4 bg-white text-slate-400">Or use your email</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Your name</label>
                <div className="relative group">
                  <User size={20} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={(e) => handleBlur('name', e.target.value)}
                    className={inputClasses(touched.name && !!errors.name)}
                    placeholder="e.g. Sebastian Gomez"
                  />
                  {touched.name && errors.name && <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase ml-2 animate-in fade-in slide-in-from-top-1">{errors.name}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Business name</label>
                <div className="relative group">
                  <Store size={20} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    onBlur={(e) => handleBlur('businessName', e.target.value)}
                    className={inputClasses(touched.businessName && !!errors.businessName)}
                    placeholder="e.g. Downtown Yoga Hub"
                  />
                  {touched.businessName && errors.businessName && <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase ml-2 animate-in fade-in slide-in-from-top-1">{errors.businessName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email address</label>
                <div className="relative group">
                  <Mail size={20} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => handleBlur('email', e.target.value)}
                    className={inputClasses(touched.email && !!errors.email)}
                    placeholder="name@domain.com"
                  />
                  {touched.email && errors.email && <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase ml-2 animate-in fade-in slide-in-from-top-1">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
                <div className="relative group">
                  <Lock size={20} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if(errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    onBlur={(e) => handleBlur('password', e.target.value)}
                    className={inputClasses(touched.password && !!errors.password)}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-4 text-slate-400 hover:text-indigo-600 transition-colors">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                {/* Real-time Validation Checklist - Show only when typing */}
                {password.length > 0 && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-1 py-1 animate-in fade-in zoom-in-95 duration-200">
                    <ValidationItem fulfilled={passwordCriteria.length} text="Min 8 characters" />
                    <ValidationItem fulfilled={passwordCriteria.upper} text="One uppercase" />
                    <ValidationItem fulfilled={passwordCriteria.lower} text="One lowercase" />
                    <ValidationItem fulfilled={passwordCriteria.special} text="One special character" />
                  </div>
                )}

                {touched.password && errors.password && <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase ml-2 animate-in fade-in slide-in-from-top-1">{errors.password}</p>}
              </div>

              <div className="pt-4">
                <button
                  onClick={handleNextStep}
                  className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-[1.8rem] font-black shadow-2xl shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98] group"
                >
                  Next step <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-12 relative animate-in slide-in-from-right duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-5 space-y-10">
                  <section>
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.25em] mb-8 flex items-center gap-3">
                       <div className="p-2 bg-indigo-50 rounded-xl"><Store size={18} /></div> Business basics
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Business Name</label>
                        <input
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className={inputClasses(false).replace('pl-12', 'pl-6')}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">WhatsApp number</label>
                        <div className="relative group">
                          <Smartphone size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                          <input
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            placeholder="+1 555 123 4567"
                            className={inputClasses(false)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Timezone</label>
                        <div className="relative group">
                            <Globe size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none" />
                            <select
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-slate-900 font-bold text-sm transition-all duration-200 outline-none focus:bg-white focus:border-indigo-600 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)] appearance-none cursor-pointer relative"
                            >
                                <option value="America/New_York">Eastern Time (ET)</option>
                                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                <option value="Europe/London">London (GMT)</option>
                                <option value="UTC">UTC (Universal)</option>
                            </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">About your services</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Briefly describe what you offer for our AI assistant..."
                          className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-slate-900 placeholder-slate-400 font-bold text-sm transition-all duration-200 outline-none focus:bg-white focus:border-indigo-600 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)] resize-none h-32"
                        />
                      </div>
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-7 space-y-10">
                  <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.25em] flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl"><Clock size={18} /></div> Working Hours
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                        You can change all of this later in Settings
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-8">
                      <p className="w-full text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1">Start with a preset:</p>
                      <button 
                        onClick={() => applyPreset('9-5')} 
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all border-2 ${activePreset === '9-5' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                      >
                        Mon–Fri 9–5
                      </button>
                      <button 
                        onClick={() => applyPreset('8-4')} 
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all border-2 ${activePreset === '8-4' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                      >
                        Mon–Fri 8–4
                      </button>
                      <button 
                        onClick={() => applyPreset('10-7')} 
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all border-2 ${activePreset === '10-7' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                      >
                        Mon–Fri 10–7
                      </button>
                    </div>
                    
                    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border-2 border-slate-100 h-[560px] overflow-y-auto no-scrollbar shadow-inner relative">
                      <BusinessHoursEditor 
                        workingHours={workingHours}
                        onChange={(h) => { setWorkingHours(h); setActivePreset(null); }}
                        simplified
                      />
                    </div>
                  </section>
                </div>
              </div>

              <div className="pt-10 flex flex-col sm:flex-row gap-5">
                <button
                  onClick={() => setStep(1)}
                  className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[1.8rem] font-black border-2 border-transparent hover:bg-slate-200 transition-all flex items-center justify-center gap-3 group order-2 sm:order-1"
                >
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={isLoading}
                  className="flex-1 py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-[1.8rem] font-black shadow-2xl shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98] disabled:opacity-50 order-1 sm:order-2"
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : <>Finish setup <CheckCircle2 size={24} /></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 text-center animate-in fade-in duration-700 delay-300">
        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">
          Already have an account? <button onClick={() => navigate('/login')} className="text-indigo-600 hover:text-indigo-700 transition-colors font-black">Log in</button>
        </p>
      </div>
    </div>
  );
};

export default SignupFlow;
