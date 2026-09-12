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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import loginImg from '../assets/img/login.png';

export const Login: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();

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
    const returnUrl = location.state?.returnUrl || sessionStorage.getItem('chokku_redirect_after_login');
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
      alert('Admin credentials cannot log in through Customer login. Please use the Admin login page.');
      return;
    }

    setSignInLoading(true);
    const success = await login(username.trim(), password);
    setSignInLoading(false);
    if (success) {
      const target = getPostAuthTarget();
      navigate(target, { replace: true });
    }
  };

  // Step 1: Handle Phone Number Next Click
  const handlePhoneNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.trim().length < 7) {
      alert('Please enter a valid mobile number.');
      return;
    }
    setSignUpStep('enter_details');
  };

  // Step 2: Handle Complete Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      alert('Please fill in all required fields.');
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
      const target = getPostAuthTarget();
      navigate(target, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf7] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-6xl w-full bg-transparent grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: REFERENCE IMAGE DISPLAY (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:col-span-6 justify-center items-center p-2">
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

            {/* Title & Subtitle */}
            <div className="text-center space-y-1.5 mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
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
                  ? 'Enter your phone number to get started'
                  : 'Enter your details to finish registration'}
              </p>
            </div>

            {/* Mode Switch Tabs (Sign In vs Sign Up) */}
            <div className="bg-gray-50 p-1.5 rounded-2xl border border-gray-200/80 flex items-center mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-white text-[#609f00] shadow-sm border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setSignUpStep('enter_phone');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white text-[#609f00] shadow-sm border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
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
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-3 text-sm font-medium bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#609f00]/20 focus:border-[#609f00] focus:bg-white transition-all"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
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

            {/* ----------------- TAB 2: SIGN UP FLOW ----------------- */}
            {activeTab === 'signup' && (
              <div className="space-y-4">
                
                {/* STEP 1: Phone Number Input + Next Button */}
                {signUpStep === 'enter_phone' && (
                  <form onSubmit={handlePhoneNext} className="space-y-4 animate-fade-in">
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
                            placeholder="Enter mobile number"
                            className="w-full pl-10 pr-4 py-3 text-sm font-medium bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#609f00]/20 focus:border-[#609f00] focus:bg-white transition-all"
                          />
                          <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!phoneNumber.trim()}
                      className="w-full bg-[#609f00] hover:bg-[#528900] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md shadow-[#609f00]/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
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
                    <div className="flex items-center justify-between bg-[#f0f9e8] p-2.5 rounded-xl border border-[#d2ea9d] text-xs">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#609f00]" />
                        <span className="font-bold text-gray-800">{countryCode} {phoneNumber}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSignUpStep('enter_phone')}
                        className="text-[#609f00] font-extrabold hover:underline inline-flex items-center gap-1 text-[11px] cursor-pointer"
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
                            className={`py-2 px-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
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

                    {/* Email Address */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="e.g. rahul@gmail.com"
                          className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] focus:bg-white font-medium"
                        />
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
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
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full bg-[#609f00] hover:bg-[#528900] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md shadow-[#609f00]/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer mt-2"
                    >
                      <span>{regLoading ? 'Creating Account...' : 'Sign Up'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>

                  </form>
                )}

              </div>
            )}



            {/* ----------------- FOOTER LINK ----------------- */}
            <div className="mt-6 pt-4 text-center border-t border-gray-100 text-xs text-gray-500 font-medium">
              {activeTab === 'signin' ? (
                <>
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signup');
                      setSignUpStep('enter_phone');
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
