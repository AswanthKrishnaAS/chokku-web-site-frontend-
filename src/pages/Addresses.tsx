import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, CheckCircle2, Home, Briefcase, Phone, Save, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';

export const Addresses: React.FC = () => {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [formData, setFormData] = useState({
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    phone: user?.phone || '',
  });

  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Please Sign In</h2>
        <p className="text-gray-500 text-sm mt-1">
          Sign in to manage your saved delivery addresses.
        </p>
        <Link to="/login" className="mt-6 inline-block">
          <Button variant="primary">Sign In Now</Button>
        </Link>
      </div>
    );
  }

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...user,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      phone: formData.phone || user.phone,
    });
    addToast('Delivery address saved successfully!', 'success');
    setIsAddingNew(false);
  };

  const displayName = user.username || user.name || 'nandu';

  return (
    <div className="bg-[#f7faf5] min-h-screen py-4 sm:py-8 px-3 sm:px-6 lg:px-8 font-sans pb-24 lg:pb-12">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header Bar */}
        <div className="flex items-center justify-between bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#488710] bg-gray-50 hover:bg-[#f0f9e8] px-3.5 py-2 rounded-2xl border border-gray-200/80 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </button>
          <h1 className="text-base sm:text-lg font-black text-gray-900">Saved Addresses</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Existing Address Display Card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="bg-[#f0f9e8] text-[#488710] border border-[#d2ea9d] p-2 rounded-2xl">
                {addressType === 'Work' ? <Briefcase className="w-4 h-4" /> : <Home className="w-4 h-4" />}
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">{addressType} Address</h2>
                <p className="text-[11px] text-gray-400 font-medium">Default Delivery Location</p>
              </div>
            </div>

            <span className="bg-emerald-100 text-[#386b0c] text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 fill-[#488710] text-white" /> DEFAULT
            </span>
          </div>

          <div className="space-y-1 text-xs text-gray-700 font-medium pt-1">
            <p className="font-extrabold text-gray-900 text-sm">{displayName}</p>
            <p className="text-gray-600">{user.address || 'No street address provided yet'}</p>
            <p className="text-gray-600">
              {[user.city, user.state, user.pincode].filter(Boolean).join(', ') || 'Location details incomplete'}
            </p>
            <p className="text-[#488710] font-bold flex items-center gap-1.5 pt-1">
              <Phone className="w-3.5 h-3.5 text-[#488710]" />
              <span>{user.phone || '+91 576567564564'}</span>
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsAddingNew(true)}
              className="w-full py-2.5 bg-[#f0f9e8] hover:bg-[#e4f4d6] text-[#488710] border border-[#d2ea9d] rounded-2xl text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>Update / Edit Address</span>
            </button>
          </div>
        </div>

        {/* Add/Update Address Form Card */}
        {isAddingNew && (
          <form onSubmit={handleSaveAddress} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-4 animate-fade-in">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">
              Update Delivery Details
            </h3>

            {/* Address Type selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Address Type</label>
              <div className="flex items-center gap-2">
                {(['Home', 'Work', 'Other'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressType(type)}
                    className={`flex-1 py-2 px-3 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      addressType === type
                        ? 'bg-[#488710] text-white border-[#488710] shadow-2xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {type === 'Home' && <Home className="w-3.5 h-3.5" />}
                    {type === 'Work' && <Briefcase className="w-3.5 h-3.5" />}
                    {type === 'Other' && <MapPin className="w-3.5 h-3.5" />}
                    <span>{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Street Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Door No, Building Name, Street, Area"
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">State *</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Pincode *</label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="Pincode"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Contact Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone Number"
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-black text-white bg-[#488710] hover:bg-[#386b0c] rounded-2xl transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Address</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
