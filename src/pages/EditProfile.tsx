import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, CheckCircle2, Save, MapPin, Mail, Phone, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';

export const EditProfile: React.FC = () => {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Please Sign In</h2>
        <p className="text-gray-500 text-sm mt-1">
          Sign in to edit your profile details.
        </p>
        <Link to="/login" className="mt-6 inline-block">
          <Button variant="primary">Sign In Now</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    addToast('Profile details updated successfully!', 'success');
    navigate('/profile');
  };

  const displayName = user.username || user.name || 'nandu';
  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="bg-[#f7faf5] min-h-screen py-4 sm:py-8 px-3 sm:px-6 lg:px-8 font-sans pb-24 lg:pb-12">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Top Header Bar */}
        <div className="flex items-center justify-between bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#488710] bg-gray-50 hover:bg-[#f0f9e8] px-3.5 py-2 rounded-2xl border border-gray-200/80 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </button>
          <h1 className="text-base sm:text-lg font-black text-gray-900">Edit Profile</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar Preview Card */}
          <div className="bg-[#f0f9e8] rounded-3xl p-5 border border-emerald-100 shadow-2xs flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#488710] text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md ring-4 ring-white">
                {initialLetter}
              </div>
              <div className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 absolute -bottom-0.5 -right-0.5 shadow-2xs">
                <Pencil className="w-3 h-3 text-[#488710]" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-gray-900 truncate">{displayName}</h2>
              <p className="text-xs text-gray-500 font-medium">Update your account details and delivery address below.</p>
            </div>
          </div>

          {/* Personal Details Section */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Username *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address Section */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">
              Delivery Address
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Street Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Door No, Street Name, Area"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="Pincode"
                    className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex-1 py-3 text-xs font-extrabold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 py-3 text-xs font-black text-white bg-[#488710] hover:bg-[#386b0c] rounded-2xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
