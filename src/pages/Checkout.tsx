import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, CreditCard, Wallet, Truck, CheckCircle2, ArrowLeft, Pencil, Plus, MapPin, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import { Order, ShippingAddress } from '../types';

export interface SavedAddress {
  id: string;
  isPrimary: boolean;
  label: string; // "Primary Address", "Address 2", "Address 3"
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const getAddressStorageKey = (user: any) => {
  if (!user) return 'chokku_addresses_guest';
  const id = user.id || user.username || user.phone || 'customer';
  return `chokku_addresses_user_${id}`;
};

export const Checkout: React.FC = () => {
  const { cartItems, subtotal, discountAmount, deliveryFee, totalAmount, clearCart, couponCode } = useCart();
  const { user, addOrder } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Saved addresses list state (Max 3 addresses per customer)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => {
    try {
      const key = getAddressStorageKey(user);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // Initial fallback if user has profile data
    if (user && (user.name || user.address)) {
      const defaultPrimary: SavedAddress = {
        id: 'addr-primary-' + Date.now(),
        isPrimary: true,
        label: 'Primary Address',
        fullName: user.name || '',
        email: user.email || `${user.username || 'customer'}@chokku.store`,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
      };
      return [defaultPrimary];
    }
    return [];
  });

  // Currently selected address ID
  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    try {
      const key = getAddressStorageKey(user);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: SavedAddress[] = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id; // Primary Address is default!
      }
    } catch {}
    if (user && (user.name || user.address)) return 'addr-primary';
    return 'new';
  });

  const [isAddingOtherAddress, setIsAddingOtherAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  // Active shipping form data
  const [formData, setFormData] = useState<ShippingAddress>(() => {
    if (savedAddresses.length > 0) {
      const primary = savedAddresses[0];
      return {
        fullName: primary.fullName,
        email: primary.email,
        phone: primary.phone,
        address: primary.address,
        city: primary.city,
        state: primary.state,
        pincode: primary.pincode,
      };
    }
    return {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      pincode: user?.pincode || '',
    };
  });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod' | 'wallet'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selected address details to formData whenever selection changes
  useEffect(() => {
    if (selectedAddressId !== 'new') {
      const found = savedAddresses.find((a) => a.id === selectedAddressId);
      if (found) {
        setFormData({
          fullName: found.fullName,
          email: found.email,
          phone: found.phone,
          address: found.address,
          city: found.city,
          state: found.state,
          pincode: found.pincode,
        });
        setIsAddingOtherAddress(false);
      }
    }
  }, [selectedAddressId, savedAddresses]);

  const handleSaveAddressesToStorage = (list: SavedAddress[]) => {
    setSavedAddresses(list);
    try {
      const key = getAddressStorageKey(user);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.error('Failed saving addresses to localStorage', e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateSavedAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress) return;

    const newList = savedAddresses.map((a) => (a.id === editingAddress.id ? editingAddress : a));
    handleSaveAddressesToStorage(newList);
    setEditingAddress(null);

    // If currently selected address was edited, update formData
    if (selectedAddressId === editingAddress.id) {
      setFormData({
        fullName: editingAddress.fullName,
        email: editingAddress.email,
        phone: editingAddress.phone,
        address: editingAddress.address,
        city: editingAddress.city,
        state: editingAddress.state,
        pincode: editingAddress.pincode,
      });
    }

    addToast('Address Updated', `${editingAddress.label} details saved successfully.`, 'success');
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.address || !formData.city || !formData.pincode) {
      addToast('Incomplete Address', 'Please fill in all required contact and shipping details.', 'error');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Save address if new or first order (Up to 3 addresses max)
      if (selectedAddressId === 'new' || savedAddresses.length === 0 || isAddingOtherAddress) {
        if (savedAddresses.length < 3) {
          const isFirst = savedAddresses.length === 0;
          const newSavedAddr: SavedAddress = {
            id: `addr-${Date.now()}`,
            isPrimary: isFirst,
            label: isFirst ? 'Primary Address' : `Address ${savedAddresses.length + 1}`,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          };
          const newList = [...savedAddresses, newSavedAddr];
          handleSaveAddressesToStorage(newList);
        }
      }

      const newOrder: Order = {
        id: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        items: [...cartItems],
        subtotal,
        discount: discountAmount,
        deliveryFee,
        totalAmount,
        status: 'Processing',
        shippingAddress: { ...formData },
        paymentMethod:
          paymentMethod === 'card'
            ? 'Credit/Debit Card'
            : paymentMethod === 'upi'
            ? 'UPI / Instant Bank Transfer'
            : paymentMethod === 'cod'
            ? 'Cash on Delivery (COD)'
            : 'Digital Wallet',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      addOrder(newOrder);
      clearCart();
      setIsSubmitting(false);

      addToast('Order Placed Successfully!', `Order ${newOrder.id} confirmed. Thank you for shopping with us!`, 'success');
      navigate('/orders');
    }, 1200);
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">No items in checkout</h2>
        <p className="text-gray-500 text-sm mt-2">
          Your cart is currently empty. Add items before proceeding to checkout.
        </p>
        <Link to="/shop" className="mt-4 inline-flex items-center gap-2 text-brand-green font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Go to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 pb-4 border-b border-gray-100">
          <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
            Secure Checkout
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
            Complete Your Order
          </h1>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Left Columns (2 cols): Information & Payment */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Step 1: Customer Contact & Address Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-sm">
                    1
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Shipping & Contact Details
                  </h3>
                </div>
                {savedAddresses.length > 0 && (
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {savedAddresses.length} / 3 Saved Addresses
                  </span>
                )}
              </div>

              {/* Saved Address Selection Cards (Up to 3 Saved Addresses) */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                    Select Delivery Address
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id && !isAddingOtherAddress;

                      return (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            setIsAddingOtherAddress(false);
                          }}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex items-start gap-4 ${
                            isSelected
                              ? 'border-[#488710] bg-[#f0f9e8]/60 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {/* Radio Checkbox Selection */}
                          <div className="mt-1">
                            <input
                              type="radio"
                              name="selectedAddress"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedAddressId(addr.id);
                                setIsAddingOtherAddress(false);
                              }}
                              className="accent-[#488710] w-4 h-4 cursor-pointer"
                            />
                          </div>

                          {/* Address Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-gray-900">{addr.fullName}</span>
                              {addr.isPrimary ? (
                                <span className="bg-[#eaf8dd] text-[#488710] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#d2ea9d]">
                                  PRIMARY ADDRESS
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                                  {addr.label}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-600 font-medium mt-1">
                              {addr.address}, {addr.city}, {addr.state} - <span className="font-bold text-gray-800">{addr.pincode}</span>
                            </p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              📞 {addr.phone} • ✉️ {addr.email}
                            </p>
                          </div>

                          {/* Edit Address Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAddress({ ...addr });
                            }}
                            className="p-2 text-gray-500 hover:text-[#488710] hover:bg-white rounded-xl border border-gray-200 transition-colors shrink-0 cursor-pointer"
                            title="Edit Address"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}

                    {/* "Other Address" Option */}
                    <div
                      onClick={() => {
                        setSelectedAddressId('new');
                        setIsAddingOtherAddress(true);
                        setFormData({
                          fullName: user?.name || '',
                          email: user?.email || '',
                          phone: user?.phone || '',
                          address: '',
                          city: '',
                          state: '',
                          pincode: '',
                        });
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                        isAddingOtherAddress || selectedAddressId === 'new'
                          ? 'border-[#488710] bg-[#f0f9e8]/60 shadow-xs'
                          : 'border-dashed border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedAddress"
                        checked={isAddingOtherAddress || selectedAddressId === 'new'}
                        onChange={() => {
                          setSelectedAddressId('new');
                          setIsAddingOtherAddress(true);
                        }}
                        className="accent-[#488710] w-4 h-4 cursor-pointer"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#f0f9e8] text-[#488710] flex items-center justify-center font-bold text-xs">
                          +
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {savedAddresses.length >= 3 ? 'Use Other Address (For this order)' : 'Other Address (Enter Different Delivery Address)'}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {savedAddresses.length >= 3
                              ? '3 saved addresses limit reached. Enter details for this order.'
                              : 'Enter a different shipping address to save as a new address.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Input Fields (Shown when no saved address or "Other Address" selected) */}
              {(savedAddresses.length === 0 || isAddingOtherAddress || selectedAddressId === 'new') && (
                <div className="pt-2 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                      {savedAddresses.length === 0 ? 'Enter Shipping Address' : 'Other Shipping Address Details'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="e.g. John Doe"
                        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Postal / Pincode *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        required
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="10001"
                        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="House / Apartment number and street name"
                        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="e.g. New York"
                        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        State / Province *
                      </label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="e.g. NY"
                        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Payment Method Selection */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-brand-blue text-white font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Select Payment Method
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Option 1: Credit / Debit Card */}
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-brand-green bg-brand-light-green/40'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-brand-green"
                  />
                  <CreditCard className="w-5 h-5 text-brand-green" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Credit/Debit Card</p>
                    <p className="text-[11px] text-gray-500">Visa, Mastercard, RuPay</p>
                  </div>
                </label>

                {/* Option 2: UPI / NetBanking */}
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-brand-green bg-brand-light-green/40'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="accent-brand-green"
                  />
                  <ShieldCheck className="w-5 h-5 text-brand-blue" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">UPI Instant Transfer</p>
                    <p className="text-[11px] text-gray-500">GPay, PhonePe, Paytm</p>
                  </div>
                </label>

                {/* Option 3: Cash on Delivery */}
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-brand-green bg-brand-light-green/40'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-brand-green"
                  />
                  <Truck className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Cash on Delivery (COD)</p>
                    <p className="text-[11px] text-gray-500">Pay cash upon delivery</p>
                  </div>
                </label>

                {/* Option 4: Digital Wallet */}
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                    paymentMethod === 'wallet'
                      ? 'border-brand-green bg-brand-light-green/40'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                    className="accent-brand-green"
                  />
                  <Wallet className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Digital Store Wallet</p>
                    <p className="text-[11px] text-gray-500">Fast one-click checkout</p>
                  </div>
                </label>

              </div>

              {/* Card Inputs if card payment selected */}
              {paymentMethod === 'card' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Security CVV
                      </label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Order Summary Side Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6 lg:sticky lg:top-24">
            <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">
              Order Summary
            </h3>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 text-xs">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-lg border border-gray-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{item.product.name}</p>
                    <p className="text-gray-500">Qty: {item.quantity} × ₹{item.product.price.toFixed(2)}</p>
                  </div>
                  <span className="font-extrabold text-gray-900">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs pt-3 border-t border-gray-100">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-brand-green font-bold">
                  <span>Coupon Discount ({couponCode})</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge</span>
                <span>{deliveryFee === 0 ? <span className="text-brand-green font-bold">FREE</span> : `₹${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total Amount</span>
                <span className="text-brand-green">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order Submit Button */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={isSubmitting}
              className="bg-brand-green hover:bg-brand-green-hover text-white font-extrabold shadow-md rounded-xl py-3.5 cursor-pointer"
            >
              {isSubmitting ? 'Processing Payment...' : `Confirm & Place Order (₹${totalAmount.toFixed(2)})`}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>256-Bit SSL Encrypted & Secured</span>
            </div>
          </div>

        </form>

      </div>

      {/* ================= EDIT ADDRESS MODAL ================= */}
      {editingAddress && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 relative animate-fade-in">
            <button
              onClick={() => setEditingAddress(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Pencil className="w-5 h-5 text-[#609f00]" />
              <h3 className="text-xl font-extrabold text-gray-900">
                Edit {editingAddress.label || 'Saved Address'}
              </h3>
            </div>

            <form onSubmit={handleUpdateSavedAddress} className="space-y-4 text-xs pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.fullName}
                    onChange={(e) => setEditingAddress({ ...editingAddress, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editingAddress.email}
                    onChange={(e) => setEditingAddress({ ...editingAddress, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editingAddress.phone}
                    onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Pincode / Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.pincode}
                    onChange={(e) => setEditingAddress({ ...editingAddress, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.address}
                    onChange={(e) => setEditingAddress({ ...editingAddress, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.city}
                    onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.state}
                    onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingAddress(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#609f00] hover:bg-brand-green-hover text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Save Address Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
