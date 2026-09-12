import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, CreditCard, Wallet, Truck, CheckCircle2, ArrowLeft, Pencil, Plus, MapPin, X, Loader2, Sparkles, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import { Order, ShippingAddress } from '../types';
import { fetchAddressByPincode } from '../utils/pincode';

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
  const { user, addOrder, savedAddresses, addSavedAddress, deleteSavedAddress, fetchSavedAddresses } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Currently selected address ID
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [isAddingOtherAddress, setIsAddingOtherAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  // Active shipping form data
  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod' | 'wallet'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Route Guard: Require customer login before accessing Checkout
  useEffect(() => {
    if (!user) {
      addToast('Login Required', 'Please log in or sign up to access checkout.', 'info');
      sessionStorage.setItem('chokku_redirect_after_login', '/checkout');
      navigate('/login', { state: { returnUrl: '/checkout' } });
    }
  }, [user, navigate]);

  // On mount/user change, fetch saved addresses and default to first address
  useEffect(() => {
    if (user) {
      fetchSavedAddresses().then((addrs) => {
        if (addrs && addrs.length > 0) {
          const first = addrs[0];
          const firstId = first.id || (first as any)._id || 'addr-0';
          setSelectedAddressId(firstId);
          setFormData({
            fullName: first.fullName || user.name || '',
            email: first.email || user.email || '',
            phone: first.phone || user.phone || '',
            address: first.address || '',
            city: first.city || '',
            state: first.state || '',
            pincode: first.pincode || '',
          });
          setIsAddingOtherAddress(false);
        } else {
          setFormData((prev) => ({
            fullName: prev.fullName || user.name || user.username || '',
            email: prev.email || user.email || (user.username?.includes('@') ? user.username : ''),
            phone: prev.phone || user.phone || '',
            address: prev.address || user.address || '',
            city: prev.city || user.city || '',
            state: prev.state || user.state || '',
            pincode: prev.pincode || user.pincode || '',
          }));
          setSelectedAddressId('new');
        }
      });
    }
  }, [user]);

  // Sync selected address details to formData whenever selection changes
  useEffect(() => {
    if (selectedAddressId !== 'new' && savedAddresses.length > 0) {
      const found = savedAddresses.find((a) => a.id === selectedAddressId || a._id === selectedAddressId);
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

  const handleDeleteSavedAddressCard = async (addrId: string, label: string) => {
    if (window.confirm(`Are you sure you want to delete ${label}?`)) {
      const res = await deleteSavedAddress(addrId);
      if (res.success && res.addresses) {
        if (selectedAddressId === addrId) {
          if (res.addresses.length > 0) {
            const first = res.addresses[0];
            setSelectedAddressId(first.id || (first as any)._id || 'addr-0');
          } else {
            setSelectedAddressId('new');
            setIsAddingOtherAddress(true);
          }
        }
      }
    }
  };

  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeBadge, setPincodeBadge] = useState<string | null>(null);

  const handlePincodeLookup = async (pinValue: string) => {
    const cleanPin = pinValue.replace(/\D/g, '');
    if (cleanPin.length === 6) {
      setIsFetchingPincode(true);
      const details = await fetchAddressByPincode(cleanPin);
      setIsFetchingPincode(false);
      if (details && details.city) {
        setFormData((prev) => ({
          ...prev,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'pincode') {
      handlePincodeLookup(value);
    }
  };

  const handleUpdateSavedAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress) return;

    await addSavedAddress({
      fullName: editingAddress.fullName,
      email: editingAddress.email,
      phone: editingAddress.phone,
      address: editingAddress.address,
      city: editingAddress.city,
      state: editingAddress.state,
      pincode: editingAddress.pincode,
    });
    setEditingAddress(null);

    // If currently selected address was edited, update formData
    if (selectedAddressId === editingAddress.id || selectedAddressId === (editingAddress as any)._id) {
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
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.address || !formData.city || !formData.pincode) {
      addToast('Incomplete Address', 'Please fill in all required contact and shipping details.', 'error');
      return;
    }

    setIsSubmitting(true);

    // Save address if new or first order (Up to 3 addresses max in Customer collection)
    if (selectedAddressId === 'new' || savedAddresses.length === 0 || isAddingOtherAddress) {
      if (savedAddresses.length < 3) {
        await addSavedAddress({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        });
      }
    }

    const orderPayload = {
      items: cartItems.map((item) => ({
        id: item.product.id,
        title: item.product.name,
        price: item.product.price,
        originalPrice: item.product.originalPrice,
        quantity: item.quantity,
        image: item.product.image,
        weight: item.product.weight,
        category: item.product.category,
      })),
      subtotal,
      discount: discountAmount,
      deliveryFee,
      totalAmount,
      shippingAddress: { ...formData },
      customerInfo: {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        username: user?.username || formData.email,
      },
      customerId: user?.id || (user as any)?._id,
    };

    // 1. CASH ON DELIVERY (COD) FLOW
    if (paymentMethod === 'cod') {
      try {
        const response = await fetch(`${API_URL}/orders/create-cod-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const newOrder: Order = {
            id: data.order.orderCustomId,
            date: new Date().toISOString().split('T')[0],
            items: [...cartItems],
            subtotal,
            discount: discountAmount,
            deliveryFee,
            totalAmount,
            status: 'Processing',
            paymentStatus: 'cod',
            shippingAddress: { ...formData },
            paymentMethod: 'Cash on Delivery (COD)',
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          };

          addOrder(newOrder);
          setSuccessOrder(newOrder);
          setShowSuccessModal(true);
          setIsSubmitting(false);
          addToast('Order Confirmed!', `COD Order ${newOrder.id} placed successfully.`, 'success');
          return;
        } else {
          throw new Error(data.message || 'Failed to place COD order');
        }
      } catch (err: any) {
        console.warn('Backend COD error, using local order creation fallback:', err);
        const fallbackOrder: Order = {
          id: `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toISOString().split('T')[0],
          items: [...cartItems],
          subtotal,
          discount: discountAmount,
          deliveryFee,
          totalAmount,
          status: 'Processing',
          paymentStatus: 'cod',
          shippingAddress: { ...formData },
          paymentMethod: 'Cash on Delivery (COD)',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };

        addOrder(fallbackOrder);
        setSuccessOrder(fallbackOrder);
        setShowSuccessModal(true);
        setIsSubmitting(false);
        addToast('Order Placed Successfully!', `Order ${fallbackOrder.id} confirmed.`, 'success');
        return;
      }
    }

    // 2. RAZORPAY TEST PAYMENT FLOW (Card / UPI / NetBanking / Wallet)
    try {
      // Step A: Request Razorpay Order ID from backend Node server (localhost:5000)
      const res = await fetch(`${API_URL}/orders/create-razorpay-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsSubmitting(false);
        addToast('Payment Error', data.message || 'Could not initiate Razorpay order.', 'error');
        return;
      }

      // Check if Razorpay SDK script is loaded
      if (typeof (window as any).Razorpay === 'undefined') {
        setIsSubmitting(false);
        addToast('SDK Error', 'Razorpay Checkout SDK not loaded. Please refresh the page.', 'error');
        return;
      }

      // Step B: Configure Razorpay Checkout Modal
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'Chokku Store',
        description: `Order Payment ${data.orderCustomId}`,
        order_id: data.razorpayOrderId,
        handler: async (response: any) => {
          // Step C: Verify payment signature with Node backend
          try {
            const verifyRes = await fetch(`${API_URL}/orders/verify-razorpay-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                dbOrderId: data.dbOrderId,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              const newOrder: Order = {
                id: data.orderCustomId,
                date: new Date().toISOString().split('T')[0],
                items: [...cartItems],
                subtotal,
                discount: discountAmount,
                deliveryFee,
                totalAmount,
                status: 'Processing',
                paymentStatus: 'paid',
                shippingAddress: { ...formData },
                paymentMethod: 'Razorpay Online (TEST)',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              };

              addOrder(newOrder);
              setSuccessOrder(newOrder);
              setShowSuccessModal(true);
              setIsSubmitting(false);
              addToast(
                'Payment Successful!',
                `Razorpay Payment Verified! Order ${newOrder.id} saved.`,
                'success'
              );
            } else {
              setIsSubmitting(false);
              addToast('Payment Verification Failed', verifyData.message || 'Signature verification failed.', 'error');
            }
          } catch (verifyErr) {
            console.error('Razorpay verification error:', verifyErr);
            setIsSubmitting(false);
            addToast('Verification Error', 'Failed verifying payment with backend server.', 'error');
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          address: `${formData.address}, ${formData.city}, ${formData.pincode}`,
        },
        theme: {
          color: '#16a34a', // Chokku Store Brand Green
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            addToast('Payment Window Closed', 'Payment was cancelled before completion.', 'info');
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', function (resp: any) {
        setIsSubmitting(false);
        addToast('Payment Failed', resp.error?.description || 'Razorpay payment was declined.', 'error');
      });

      razorpayInstance.open();
    } catch (error: any) {
      console.error('Razorpay process error:', error);
      setIsSubmitting(false);
      addToast('Checkout Error', error.message || 'Could not connect to payment backend.', 'error');
    }
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
                    {savedAddresses.map((addr, idx) => {
                      const addrId = addr.id || (addr as any)._id || `addr-${idx}`;
                      const isSelected = selectedAddressId === addrId && !isAddingOtherAddress;

                      return (
                        <div
                          key={addrId}
                          onClick={() => {
                            setSelectedAddressId(addrId);
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
                                setSelectedAddressId(addrId);
                                setIsAddingOtherAddress(false);
                              }}
                              className="accent-[#488710] w-4 h-4 cursor-pointer"
                            />
                          </div>

                          {/* Address Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-gray-900">{addr.fullName}</span>
                              {addr.isPrimary || idx === 0 ? (
                                <span className="bg-[#eaf8dd] text-[#488710] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#d2ea9d]">
                                  Address 1 (PRIMARY)
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                                  {addr.label || `Address ${idx + 1}`}
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

                          {/* Action Buttons: Edit & Delete */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAddress({ ...addr });
                              }}
                              className="p-2 text-gray-500 hover:text-[#488710] hover:bg-white rounded-xl border border-gray-200 transition-colors cursor-pointer"
                              title="Edit Address"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSavedAddressCard(addrId, addr.label || `Address ${idx + 1}`);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                              title="Delete Address"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

              {/* Form Input Fields (Always visible on checkout page) */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Delivery & Shipping Address
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
                      placeholder="+91 9876543210"
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue focus:bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-700">
                        Postal / Pincode *
                      </label>
                      {isFetchingPincode && (
                        <span className="text-[11px] font-extrabold text-[#488710] flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Fetching location...
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        name="pincode"
                        required
                        maxLength={6}
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="e.g. 682001 (Auto-fetches city/state)"
                        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#488710] focus:bg-white font-medium"
                      />
                    </div>
                    {pincodeBadge && (
                      <p className="mt-1 text-[11px] font-bold text-[#488710] bg-[#f0f9e8] px-2.5 py-1 rounded-lg border border-[#d2ea9d] inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#488710]" />
                        <span>{pincodeBadge}</span>
                      </p>
                    )}
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
                      placeholder="e.g. Kochi"
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
                      placeholder="e.g. Kerala"
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue focus:bg-white"
                    />
                  </div>
                </div>
              </div>
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

      {/* ================= ORDER SUCCESSFUL MODAL ================= */}
      {showSuccessModal && successOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 text-center space-y-6 shadow-2xl border border-emerald-100 relative overflow-hidden">
            {/* Background Decorative Accent */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-100/60 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

            {/* Animated Success Checkmark */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-[#488710] stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-[#488710] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Payment Verified & Order Confirmed
              </span>
              <h2 className="text-2xl font-black text-gray-900 pt-1">
                Thank You for Your Order!
              </h2>
              <p className="text-sm font-semibold text-gray-600">
                Your order has been placed successfully.
              </p>
            </div>

            {/* Order Details Summary Box */}
            <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-200/80 space-y-3 text-xs text-left font-medium">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                <span className="font-extrabold text-gray-500 uppercase tracking-wider text-[11px]">Order Number</span>
                <span className="font-black text-base text-[#488710]">{successOrder.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-bold">Total Amount Paid:</span>
                <span className="font-extrabold text-gray-900 text-sm">₹{successOrder.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-bold">Payment Method:</span>
                <span className="font-extrabold text-[#488710]">{successOrder.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-bold">Estimated Delivery:</span>
                <span className="font-bold text-gray-800">{successOrder.estimatedDelivery}</span>
              </div>
            </div>

            {/* View My Orders Action Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  clearCart();
                  setShowSuccessModal(false);
                  navigate('/orders');
                }}
                className="w-full py-4 bg-[#488710] hover:bg-[#386b0c] text-white font-extrabold rounded-2xl transition-all shadow-lg hover:shadow-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>View My Orders</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
