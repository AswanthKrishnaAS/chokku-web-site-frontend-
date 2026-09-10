import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Phone,
  User as UserIcon,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import loginImg from '../assets/img/login.png';

export const Login: React.FC = () => {
  // Main Tab State: 'phone_otp' (Registration via OTP) or 'signin' (Username + Password Sign In)
  const [activeTab, setActiveTab] = useState<'phone_otp' | 'signin'>('phone_otp');

  // Sign In Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);

  // OTP Registration Flow states:
  // Step 1: 'enter_phone' -> Step 2: 'verify_otp' -> Step 3: 'enter_details'
  const [otpStep, setOtpStep] = useState<'enter_phone' | 'verify_otp' | 'enter_details'>('enter_phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // Registration Details Form state
  const [regName, setRegName] = useState('');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const { login, register, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Handle Username + Password Sign In
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    if (username.trim().toLowerCase() === 'chokku@store.com') {
      alert('Admin credentials cannot log in through Customer login. Please use the Admin login page.');
      return;
    }

    setSignInLoading(true);
    const success = await login(username.trim(), password);
    setSignInLoading(false);
    if (success) {
      navigate('/profile');
    }
  };

  // Step 1: Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.trim().length < 7) {
      alert('Please enter a valid mobile number.');
      return;
    }
    setOtpLoading(true);
    const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
    const result = await sendOtp(fullPhone);
    setOtpLoading(false);
    if (result.success) {
      setOtpStep('verify_otp');
    }
  };

  // Step 2: Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setOtpLoading(true);
    const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
    const success = await verifyOtp(fullPhone, otpCode.trim());
    setOtpLoading(false);
    if (success) {
      setOtpVerified(true);
      setOtpStep('enter_details');
    }
  };

  // Step 3: Handle Save / Register Details
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regPassword) {
      alert('Please fill in all required fields.');
      return;
    }
    setRegLoading(true);
    const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
    const success = await register({
      name: regName.trim(),
      phone: fullPhone,
      gender: regGender,
      username: regUsername.trim(),
      password: regPassword,
    });
    setRegLoading(false);
    if (success) {
      navigate('/profile');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf7] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-6xl w-full bg-transparent grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: REFERENCE IMAGE DISPLAY */}
        <div className="lg:col-span-6 flex justify-center items-center p-2">
          <img
            src={loginImg}
            alt="Chokku Store Login Illustration"
            className="w-full max-w-lg lg:max-w-xl h-auto object-contain rounded-3xl"
          />
        </div>

        {/* RIGHT COLUMN: AUTHENTICATION CARD */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md bg-white rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-gray-200/80 border border-gray-100 transition-all duration-300">
            
            {/* Top Green Bag Icon Badge */}
            <div className="w-16 h-16 rounded-full bg-[#f0f9e8] border border-[#d2ea9d] mx-auto flex items-center justify-center shadow-2xs mb-5">
              <div className="w-11 h-11 rounded-full bg-[#609f00] flex items-center justify-center text-white shadow-md">
                <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>

            {/* Title & Subtitle Matching User Request */}
            <div className="text-center space-y-1.5 mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Login to your account
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Enter your phone number or email to continue
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div className="bg-gray-50 p-1.5 rounded-2xl border border-gray-200/80 flex items-center mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('phone_otp');
                  setOtpStep('enter_phone');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'phone_otp'
                    ? 'bg-white text-[#609f00] shadow-sm border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone / OTP</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'signin'
                    ? 'bg-white text-[#609f00] shadow-sm border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>

            {/* ----------------- TAB 1: PHONE / OTP REGISTRATION FLOW ----------------- */}
            {activeTab === 'phone_otp' && (
              <div className="space-y-4">
                
                {/* STEP 1: Enter Mobile Number */}
                {otpStep === 'enter_phone' && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Phone Number
                      </label>
                      <div className="flex items-center gap-2">
                        {/* Country Code Selector */}
                        <div className="relative">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="appearance-none bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold py-3 pl-3 pr-7 rounded-xl focus:outline-none focus:border-[#609f00] focus:bg-white transition-all cursor-pointer"
                          >
                            <option value="+91">+91 🇮🇳</option>
                            <option value="+1">+1 🇺🇸</option>
                            <option value="+44">+44 🇬🇧</option>
                            <option value="+971">+971 🇦🇪</option>
                          </select>
                        </div>

                        {/* Phone Input */}
                        <div className="relative flex-1">
                          <input
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Enter your phone number"
                            className="w-full pl-10 pr-4 py-3 text-sm font-medium bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#609f00]/20 focus:border-[#609f00] focus:bg-white transition-all"
                          />
                          <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading || !phoneNumber.trim()}
                      className="w-full bg-[#609f00] hover:bg-[#528900] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md shadow-[#609f00]/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                    >
                      <span>{otpLoading ? 'Sending OTP...' : 'Send OTP'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </form>
                )}

                {/* STEP 2: Verify OTP Code */}
                {otpStep === 'verify_otp' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
                    <div className="bg-[#f0f9e8] border border-[#d2ea9d] p-3 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#488710]">OTP Code Sent</p>
                        <p className="text-gray-600 font-medium">To {countryCode} {phoneNumber}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpStep('enter_phone')}
                        className="text-[#609f00] font-extrabold underline hover:text-emerald-800 text-[11px]"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Enter 4-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Enter 1234 (Demo OTP)"
                        className="w-full text-center tracking-widest text-lg font-bold py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] focus:bg-white"
                      />
                      <p className="text-[11px] text-gray-400 mt-1 text-center font-medium">
                        Demo OTP Code is <span className="font-bold text-[#609f00]">1234</span>
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading || !otpCode.trim()}
                      className="w-full bg-[#609f00] hover:bg-[#528900] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md shadow-[#609f00]/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                    >
                      <span>{otpLoading ? 'Verifying...' : 'Verify OTP'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </form>
                )}

                {/* STEP 3: Enter Registration Details (Name, Gender, Username, Password) */}
                {otpStep === 'enter_details' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fade-in">
                    
                    <div className="flex items-center gap-2 text-xs font-bold text-[#609f00] bg-[#f0f9e8] p-2.5 rounded-xl border border-[#d2ea9d]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Mobile Verified ({countryCode} {phoneNumber})</span>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] focus:bg-white"
                      />
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
                            className={`py-2 px-2 text-xs font-extrabold rounded-xl border transition-all ${
                              regGender === g
                                ? 'bg-[#609f00] text-white border-[#609f00] shadow-sm'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Choose Username
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="e.g. rahul_sharma"
                          className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] focus:bg-white"
                        />
                        <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Create Password
                      </label>
                      <div className="relative">
                        <input
                          type={regShowPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full pl-9 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] focus:bg-white"
                        />
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <button
                          type="button"
                          onClick={() => setRegShowPassword(!regShowPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full bg-[#609f00] hover:bg-[#528900] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md shadow-[#609f00]/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer pt-3"
                    >
                      <span>{regLoading ? 'Saving Account...' : 'Save & Register'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>

                  </form>
                )}

              </div>
            )}

            {/* ----------------- TAB 2: SIGN IN FLOW (USERNAME + PASSWORD) ----------------- */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                
                {/* Username Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Username / User ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username (e.g. johndoe)"
                      className="w-full pl-10 pr-4 py-3 text-sm font-medium bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#609f00]/20 focus:border-[#609f00] focus:bg-white transition-all"
                    />
                    <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 text-sm font-medium bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#609f00]/20 focus:border-[#609f00] focus:bg-white transition-all"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 accent-[#609f00] rounded cursor-pointer" />
                    <span className="text-gray-600 font-medium">Remember me</span>
                  </label>
                  <span className="text-[#609f00] font-bold hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={signInLoading || !username.trim() || !password}
                  className="w-full bg-[#609f00] hover:bg-[#528900] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md shadow-[#609f00]/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                >
                  <span>{signInLoading ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            )}

            {/* ----------------- DIVIDER: OR ----------------- */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <span className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                OR
              </span>
            </div>

            {/* ----------------- SOCIAL LOGINS (Google & WhatsApp) ----------------- */}
            <div className="space-y-2.5">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => alert('Google authentication is available in production mode.')}
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-xs shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.13C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.63H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.37l3.99-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.99 3.13c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={() => alert('WhatsApp login code will be sent to your registered phone.')}
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-xs shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4 text-emerald-600 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.019 4.043-1.06.201.208z" />
                </svg>
                <span>Continue with WhatsApp</span>
              </button>
            </div>

            {/* ----------------- FOOTER LINK ----------------- */}
            <div className="mt-6 pt-4 text-center border-t border-gray-100 text-xs text-gray-500 font-medium">
              {activeTab === 'signin' ? (
                <>
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('phone_otp');
                      setOtpStep('enter_phone');
                    }}
                    className="font-bold text-[#609f00] hover:underline ml-1 cursor-pointer"
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
                    className="font-bold text-[#609f00] hover:underline ml-1 cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
