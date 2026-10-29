import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Phone,
  User as UserIcon,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Edit2,
  Mail,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import loginImg from '../assets/img/login.png';

export const Login: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, showWelcomeModal } = useAuth();
  const { addToast } = useToast();

  // Main Tab State: 'signin' or 'signup'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);

  // Sign Up Flow states:
  // Step 1: 'enter_phone' -> Step 2: 'enter_details'
  const [signUpStep, setSignUpStep] = useState<'enter_phone' | 'enter_details'>('enter_phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');

  // Registration Details Form state
  const [regName, setRegName] = useState('');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const getPostAuthTarget = (): string => {
    const returnUrl = location.state?.returnUrl || location.state?.from || sessionStorage.getItem('chokku_redirect_after_login');
    const buyNowProductId = location.state?.buyNowProductId || sessionStorage.getItem('chokku_buy_now_product_id');

    sessionStorage.removeItem('chokku_redirect_after_login');
    sessionStorage.removeItem('chokku_buy_now_product_id');
    sessionStorage.removeItem('chokku_buy_now_qty');

    if (returnUrl) return returnUrl;
    if (buyNowProductId) return `/product/${buyNowProductId}?autoBuy=true`;
    return '/profile';
  };

  // Handle Sign In Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    if (username.trim().toLowerCase() === 'chokku@store.com') {
      addToast('Access Denied', 'Admin credentials cannot log in through Customer login. Please use the Admin login page.', 'error');
      return;
    }

    setSignInLoading(true);
    const success = await login(username.trim(), password);
    setSignInLoading(false);
    if (success) {
      showWelcomeModal(username.trim(), false);
      const target = getPostAuthTarget();
      navigate(target, { replace: true });
    }
  };

  // Step 1: Handle Phone Number Next Click
  const handlePhoneNext = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length !== 10) {
      addToast('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number to continue.', 'error');
      return;
    }
    setSignUpStep('enter_details');
  };

  // Step 2: Handle Complete Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      addToast('Missing Details', 'Please fill in all required fields.', 'error');
      return;
    }
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length !== 10) {
      addToast('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.', 'error');
      setSignUpStep('enter_phone');
      return;
    }
    setRegLoading(true);
    const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
    const success = await register({
      name: regName.trim(),
      phone: fullPhone,
      gender: regGender,
      email: regEmail.trim(),
      username: regEmail.trim(),
      password: regPassword,
    });
    setRegLoading(false);
    if (success) {
      showWelcomeModal(regName.trim(), true);
      const target = getPostAuthTarget();
      navigate(target, { replace: true });
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-130px)] flex flex-col justify-start lg:justify-center items-center px-4 pt-3 pb-28 sm:px-6 sm:py-8 lg:p-10 bg-[#f8faf7]/60 sm:bg-[#f8faf7] font-sans">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: REFERENCE IMAGE DISPLAY (Hidden on Mobile, Visible on Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 justify-center items-center p-4">
          <img
            src={loginImg}
            alt="Chokku Store Login Illustration"
            className="w-full max-w-lg lg:max-w-xl h-auto object-contain rounded-3xl drop-shadow-md select-none pointer-events-none"
          />
        </div>

        {/* RIGHT COLUMN: AUTHENTICATION CARD */}
        <div className="w-full lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md bg-white rounded-3xl sm:rounded-[32px] p-5 sm:p-8 lg:p-9 shadow-xl shadow-gray-200/70 border border-gray-100 transition-all duration-300">
            
            {/* Top Green Bag Icon Badge */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[22px] bg-gradient-to-br from-[#f0f9e8] to-[#e1f3cd] border border-[#cbe595] mx-auto flex items-center justify-center shadow-xs mb-3.5 sm:mb-5 transition-transform hover:scale-105">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#488710] flex items-center justify-center text-white shadow-md shadow-[#488710]/25">
                <ShoppingBag className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.3]" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-1 mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">
                {activeTab === 'signin'
                  ? 'Sign In to your account'
                  : signUpStep === 'enter_phone'
                  ? 'Create your account'
                  : 'Complete your profile'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                {activeTab === 'signin'
                  ? 'Enter your email address and password to continue'
                  : signUpStep === 'enter_phone'
                  ? 'Enter your mobile number to get started'
                  : 'Enter your details to finish registration'}
              </p>
            </div>

            {/* Mode Switch Tabs (Sign In vs Sign Up) */}
            <div className="bg-gray-100/80 p-1 rounded-2xl border border-gray-200/60 flex items-center mb-5 sm:mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-white text-[#488710] shadow-sm shadow-gray-200/80 border border-gray-200/60 scale-[1.01]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <UserIcon className="w-4 h-4 stroke-[2.2]" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setSignUpStep('enter_phone');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white text-[#488710] shadow-sm shadow-gray-200/80 border border-gray-200/60 scale-[1.01]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Phone className="w-4 h-4 stroke-[2.2]" />
                <span>Sign Up</span>
              </button>
            </div>

            {/* ----------------- TAB 1: SIGN IN FLOW ----------------- */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4 animate-fade-in">
                
                {/* Email Address Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 peer-focus:text-[#488710] transition-colors flex items-center justify-center">
                      <Mail className="w-4 h-4 stroke-[2]" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your email address"
                      className="peer w-full h-11 sm:h-12 pl-10 pr-4 text-sm font-medium bg-gray-50/70 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-3 focus:ring-[#488710]/15 focus:border-[#488710] focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 peer-focus:text-[#488710] transition-colors flex items-center justify-center">
                      <Lock className="w-4 h-4 stroke-[2]" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="peer w-full h-11 sm:h-12 pl-10 pr-10 text-sm font-medium bg-gray-50/70 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-3 focus:ring-[#488710]/15 focus:border-[#488710] focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-[#488710] accent-[#488710] focus:ring-[#488710] cursor-pointer"
                    />
                    <span className="text-gray-600 font-medium group-hover:text-gray-800 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => addToast('Forgot Password', 'Please contact support at support@chokkustore.com to reset your credentials.', 'info')}
                    className="text-[#488710] font-bold hover:text-[#3d730d] hover:underline cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={signInLoading || !username.trim() || !password}
                  className="w-full h-12 bg-[#488710] hover:bg-[#3d730d] active:scale-[0.99] text-white font-extrabold rounded-xl sm:rounded-2xl shadow-md shadow-[#488710]/25 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{signInLoading ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            )}

            {/* ----------------- TAB 2: SIGN UP FLOW ----------------- */}
            {activeTab === 'signup' && (
              <div className="space-y-4">
                
                {/* STEP 1: Phone Number Input + Next Button */}
                {signUpStep === 'enter_phone' && (
                  <form onSubmit={handlePhoneNext} className="space-y-4 animate-fade-in">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700">
                          Mobile Number
                        </label>
                        <span className={`text-[11px] font-bold ${phoneNumber.length === 10 ? 'text-[#488710]' : 'text-gray-400'}`}>
                          {phoneNumber.length}/10 digits
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Country Code Selector */}
                        <div className="relative">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="appearance-none h-11 sm:h-12 bg-gray-50/70 border border-gray-200 text-gray-800 text-xs sm:text-sm font-bold pl-3 pr-7 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-3 focus:ring-[#488710]/15 focus:border-[#488710] focus:bg-white transition-all cursor-pointer"
                          >
                            <option value="+91">+91 🇮🇳</option>
                            <option value="+1">+1 🇺🇸</option>
                            <option value="+44">+44 🇬🇧</option>
                            <option value="+971">+971 🇦🇪</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Phone Input */}
                        <div className="relative flex-1 flex items-center">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 peer-focus:text-[#488710] transition-colors flex items-center justify-center">
                            <Phone className="w-4 h-4 stroke-[2]" />
                          </div>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                            required
                            value={phoneNumber}
                            onChange={(e) => {
                              const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setPhoneNumber(digitsOnly);
                            }}
                            placeholder="Enter 10-digit mobile number"
                            className="peer w-full h-11 sm:h-12 pl-10 pr-4 text-sm font-medium bg-gray-50/70 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-3 focus:ring-[#488710]/15 focus:border-[#488710] focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      {phoneNumber.length > 0 && phoneNumber.length < 10 && (
                        <p className="text-[11px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                          Please enter all 10 digits ({10 - phoneNumber.length} remaining)
                        </p>
                      )}
                      {phoneNumber.length === 10 && (
                        <p className="text-[11px] text-[#488710] font-semibold mt-1.5 flex items-center gap-1">
                          ✓ Valid 10-digit mobile number
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={phoneNumber.length !== 10}
                      className="w-full h-12 bg-[#488710] hover:bg-[#3d730d] active:scale-[0.99] text-white font-extrabold rounded-xl sm:rounded-2xl shadow-md shadow-[#488710]/25 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </form>
                )}

                {/* STEP 2: Registration Details Form */}
                {signUpStep === 'enter_details' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fade-in">
                    
                    {/* Mobile Number Display Badge */}
                    <div className="flex items-center justify-between bg-[#f0f9e8] p-3 rounded-xl sm:rounded-2xl border border-[#d2ea9d] text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#488710]/10 flex items-center justify-center text-[#488710]">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-extrabold text-gray-900">{countryCode} {phoneNumber}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSignUpStep('enter_phone')}
                        className="text-[#488710] font-extrabold hover:underline inline-flex items-center gap-1 text-xs cursor-pointer px-2 py-1 rounded-lg hover:bg-[#488710]/10 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Full Name
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 peer-focus:text-[#488710] transition-colors flex items-center justify-center">
                          <UserIcon className="w-4 h-4 stroke-[2]" />
                        </div>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Enter your full name"
                          className="peer w-full h-11 sm:h-12 pl-10 pr-4 text-sm font-medium bg-gray-50/70 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-3 focus:ring-[#488710]/15 focus:border-[#488710] focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    {/* Gender Selection */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Gender
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Male', 'Female', 'Other'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setRegGender(g)}
                            className={`h-10 text-xs font-extrabold rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center justify-center ${
                              regGender === g
                                ? 'bg-[#488710] text-white border-[#488710] shadow-sm shadow-[#488710]/20'
                                : 'bg-gray-50/70 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 peer-focus:text-[#488710] transition-colors flex items-center justify-center">
                          <Mail className="w-4 h-4 stroke-[2]" />
                        </div>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="e.g. rahul@gmail.com"
                          className="peer w-full h-11 sm:h-12 pl-10 pr-4 text-sm font-medium bg-gray-50/70 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-3 focus:ring-[#488710]/15 focus:border-[#488710] focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Create Password
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 peer-focus:text-[#488710] transition-colors flex items-center justify-center">
                          <Lock className="w-4 h-4 stroke-[2]" />
                        </div>
                        <input
                          type={regShowPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="peer w-full h-11 sm:h-12 pl-10 pr-10 text-sm font-medium bg-gray-50/70 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-3 focus:ring-[#488710]/15 focus:border-[#488710] focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => setRegShowPassword(!regShowPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
                          aria-label={regShowPassword ? 'Hide password' : 'Show password'}
                        >
                          {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full h-12 bg-[#488710] hover:bg-[#3d730d] active:scale-[0.99] text-white font-extrabold rounded-xl sm:rounded-2xl shadow-md shadow-[#488710]/25 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                    >
                      <span>{regLoading ? 'Creating Account...' : 'Sign Up'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>

                  </form>
                )}

              </div>
            )}

            {/* ----------------- FOOTER LINK ----------------- */}
            <div className="mt-5 pt-4 text-center border-t border-gray-100 text-xs text-gray-500 font-medium">
              {activeTab === 'signin' ? (
                <>
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signup');
                      setSignUpStep('enter_phone');
                    }}
                    className="font-bold text-[#488710] hover:text-[#3d730d] hover:underline ml-1 cursor-pointer"
                  >
                    Sign up now
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className="font-bold text-[#488710] hover:text-[#3d730d] hover:underline ml-1 cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>

            {/* Trust badge */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium mt-3.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#488710]" />
              <span>100% Secure &amp; Encrypted</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

