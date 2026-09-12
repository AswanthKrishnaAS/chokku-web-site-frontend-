import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, CheckCircle2, Home, Briefcase, Phone, Save, User, Loader2, Sparkles, Trash2, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';
import { fetchAddressByPincode } from '../utils/pincode';
import { SavedAddress } from '../types';

export const Addresses: React.FC = () => {
  const { user, isAuthenticated, savedAddresses, addSavedAddress, deleteSavedAddress, fetchSavedAddresses } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
  });

  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeBadge, setPincodeBadge] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSavedAddresses();
    }
  }, [user]);

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, pincode: val }));

    const cleanPin = val.replace(/\D/g, '');
    if (cleanPin.length === 6) {
      setIsFetchingPincode(true);
      const details = await fetchAddressByPincode(cleanPin);
      setIsFetchingPincode(false);
      if (details && details.city) {
        setFormData((prev) => ({
          ...prev,
          pincode: val,
          city: details.city,
          state: details.state || prev.state,
        }));
        setPincodeBadge(`📍 Auto-filled: ${details.district || details.city}, ${details.state}`);
        addToast('Pincode Details Fetched!', `City: ${details.city}, State: ${details.state}`, 'success');
      } else {
        setPincodeBadge(null);
      }
    } else {
      setPincodeBadge(null);
    }
  };

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

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.address || !formData.city || !formData.pincode || !formData.phone) {
      addToast('Missing Details', 'Please fill in all required address fields.', 'error');
      return;
    }

    const res = await addSavedAddress({
      fullName: formData.fullName,
      email: formData.email || user.email || '',
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
    });

    if (res.success) {
      setIsAddingNew(false);
      setFormData({
        fullName: user?.name || user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
    }
  };

  const handleDeleteAddress = async (addrId: string, label: string) => {
    if (window.confirm(`Are you sure you want to delete ${label}?`)) {
      await deleteSavedAddress(addrId);
    }
  };

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
          <span className="text-xs font-bold text-[#488710] bg-[#f0f9e8] px-3 py-1 rounded-full border border-[#d2ea9d]">
            {savedAddresses.length} / 3 Max Saved
          </span>
        </div>

        {/* Saved Address List Cards */}
        {savedAddresses.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-2xs space-y-3">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">No Saved Addresses Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Add up to 3 delivery addresses for quick auto-fill during checkout.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedAddresses.map((addr, idx) => {
              const addrId = addr.id || (addr as any)._id || `addr-${idx}`;
              const label = addr.label || `Address ${idx + 1}`;

              return (
                <div key={addrId} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-3 relative">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#f0f9e8] text-[#488710] border border-[#d2ea9d] p-2 rounded-2xl">
                        <Home className="w-4 h-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-extrabold text-gray-900">{label}</h2>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {addr.isPrimary || idx === 0 ? 'Primary Default Address' : 'Saved Delivery Location'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(addr.isPrimary || idx === 0) && (
                        <span className="bg-emerald-100 text-[#386b0c] text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 fill-[#488710] text-white" /> PRIMARY
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addrId, label)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl border border-gray-200 transition-colors cursor-pointer"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-700 font-medium pt-1">
                    <p className="font-extrabold text-gray-900 text-sm">{addr.fullName}</p>
                    <p className="text-gray-600">{addr.address}</p>
                    <p className="text-gray-600">
                      {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                    </p>
                    <div className="flex items-center gap-4 text-[#488710] font-bold pt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{addr.phone}</span>
                      </span>
                      {addr.email && (
                        <span className="flex items-center gap-1 text-gray-500 font-normal">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{addr.email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add New Address Button */}
        {!isAddingNew && savedAddresses.length < 3 && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="w-full py-3.5 bg-white hover:bg-[#f0f9e8] text-[#488710] border-2 border-dashed border-[#d2ea9d] rounded-3xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Saved Address ({savedAddresses.length} / 3 Used)</span>
          </button>
        )}

        {/* Max Limit Reached Banner */}
        {!isAddingNew && savedAddresses.length >= 3 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 text-center text-xs text-amber-800 font-bold">
            ⚠️ Maximum limit of 3 saved addresses reached. Please delete an address to add a new one.
          </div>
        )}

        {/* Add Address Form Card */}
        {isAddingNew && (
          <form onSubmit={handleSaveAddress} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                Add Address {savedAddresses.length + 1} of 3
              </h3>
              <span className="text-[11px] font-bold text-[#488710]">Pincode Auto-Fill Enabled</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">Pincode *</label>
                  {isFetchingPincode && (
                    <span className="text-[10px] font-bold text-[#488710] flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handlePincodeChange}
                  placeholder="Pincode (e.g. 682001)"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                />
                {pincodeBadge && (
                  <p className="mt-1 text-[10px] font-bold text-[#488710] bg-[#f0f9e8] px-2 py-0.5 rounded-lg border border-[#d2ea9d] inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#488710]" />
                    <span>{pincodeBadge}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Street Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Door No, Building Name, Street, Area"
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">City *</label>
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
                <label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                />
              </div>
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
                <span>Save New Address</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
