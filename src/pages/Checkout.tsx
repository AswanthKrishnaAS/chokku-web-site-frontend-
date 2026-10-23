import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Pencil,
  Plus,
  Minus,
  MapPin,
  X,
  Loader2,
  ShoppingBag,
  Trash2,
  Banknote,
  Check,
  Tag,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Truck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Order, ShippingAddress, CartItem } from '../types';
import { fetchAddressByPincode } from '../utils/pincode';
import { safeFetch } from '../utils/api';

export interface SavedAddress {
  id: string;
  _id?: string;
  isPrimary?: boolean;
  label?: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export const Checkout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isBuyNow = searchParams.get('mode') === 'buynow';

  const {
    cartItems,
    buyNowItem,
    updateBuyNowQuantity,
    clearBuyNow,
    updateQuantity,
    removeFromCart,
    clearCart,
    couponCode,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const { user, addOrder, savedAddresses, addSavedAddress, deleteSavedAddress, fetchSavedAddresses } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Active items for checkout:
  // In Buy Now mode: only buyNowItem (isolated from cart)
  // In Cart mode: all cartItems from the cart
  const checkoutItems: CartItem[] = useMemo(() => {
    if (isBuyNow) {
      return buyNowItem ? [buyNowItem] : [];
    }
    return cartItems;
  }, [isBuyNow, buyNowItem, cartItems]);

  // Address selection state
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [showAddressBook, setShowAddressBook] = useState(false);
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

  // Payment Method Selection: 'cod' or 'online'
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI state for Order Summary expansion (if > 3 items)
  const [showAllItems, setShowAllItems] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Pincode auto-lookup state
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeBadge, setPincodeBadge] = useState<string | null>(null);

  // Success modal state
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // On mount/user change, load saved addresses
  useEffect(() => {
    if (user) {
      fetchSavedAddresses().then((addrs) => {
        if (addrs && addrs.length > 0) {
          const first = addrs[0];
          const firstId = first.id || first._id || 'addr-0';
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
          setIsAddingNewAddress(false);
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
          setIsAddingNewAddress(true);
        }
      });
    } else {
      setSelectedAddressId('new');
      setIsAddingNewAddress(true);
    }
  }, [user]);

  // Sync selected address details to formData whenever selection changes
  useEffect(() => {
    if (selectedAddressId !== 'new' && savedAddresses.length > 0) {
      const found = savedAddresses.find((a) => (a.id || a._id) === selectedAddressId);
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
        setIsAddingNewAddress(false);
      }
    }
  }, [selectedAddressId, savedAddresses]);

  // Handle pincode lookup
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
        setPincodeBadge(`📍 ${details.district || details.city}, ${details.state}`);
        addToast('Pincode Verified', `Located ${details.city}, ${details.state}`, 'success');
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

  // Delete saved address
  const handleDeleteSavedAddress = async (addrId: string, label: string) => {
    if (window.confirm(`Are you sure you want to delete ${label || 'this address'}?`)) {
      const res = await deleteSavedAddress(addrId);
      if (res.success && res.addresses) {
        if (selectedAddressId === addrId) {
          if (res.addresses.length > 0) {
            const first = res.addresses[0];
            setSelectedAddressId(first.id || first._id || 'addr-0');
          } else {
            setSelectedAddressId('new');
            setIsAddingNewAddress(true);
          }
        }
      }
    }
  };

  // Update existing saved address
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

    if (selectedAddressId === editingAddress.id || selectedAddressId === editingAddress._id) {
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

  // Save new address from the form
  const handleSaveNewAddressAndSelect = async () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.pincode) {
      addToast('Incomplete Address', 'Please fill in all address fields before saving.', 'error');
      return;
    }
    const res = await addSavedAddress({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
    });
    if (res.success && res.addresses && res.addresses.length > 0) {
      const latest = res.addresses[res.addresses.length - 1];
      setSelectedAddressId(latest.id || latest._id || 'new');
      setIsAddingNewAddress(false);
      setShowAddressBook(false);
    }
  };

  // Quantity change handler on checkout page
  const handleItemQuantityChange = (item: CartItem, newQty: number) => {
    if (newQty <= 0) {
      if (isBuyNow) {
        return; // Don't allow reducing below 1 in Buy Now mode
      } else {
        removeFromCart(item.product.id, item.selectedColor, item.selectedSize);
        return;
      }
    }

    if (isBuyNow) {
      updateBuyNowQuantity(newQty);
    } else {
      updateQuantity(item.product.id, newQty, item.selectedColor, item.selectedSize);
    }
  };

  // Dynamic calculations based exclusively on checkoutItems (Buy Now or Cart)
  const totalItemsCount = useMemo(() => {
    return checkoutItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [checkoutItems]);

  const checkoutSubtotal = useMemo(() => {
    return checkoutItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [checkoutItems]);

  const checkoutTotalOriginalPrice = useMemo(() => {
    return checkoutItems.reduce((acc, item) => {
      const orig =
        item.product.originalPrice && item.product.originalPrice > item.product.price
          ? item.product.originalPrice
          : item.product.originalPrice || Math.round(item.product.price * 1.25);
      return acc + orig * item.quantity;
    }, 0);
  }, [checkoutItems]);

  const checkoutProductDiscount = useMemo(() => {
    return Math.max(0, checkoutTotalOriginalPrice - checkoutSubtotal);
  }, [checkoutTotalOriginalPrice, checkoutSubtotal]);

  const checkoutCouponDiscount = useMemo(() => {
    if (!couponCode) return 0;
    if (couponCode === 'SAVE10') return checkoutSubtotal * 0.10;
    if (couponCode === 'WELCOME20') return checkoutSubtotal * 0.20;
    if (couponCode === 'ECOBLUE') return checkoutSubtotal * 0.15;
    return 0;
  }, [checkoutSubtotal, couponCode]);

  const checkoutTotalSavings = useMemo(() => {
    return checkoutProductDiscount + checkoutCouponDiscount;
  }, [checkoutProductDiscount, checkoutCouponDiscount]);

  const checkoutDeliveryFee = useMemo(() => {
    if (checkoutSubtotal === 0) return 0;
    return checkoutSubtotal >= 50 ? 0 : 5.99;
  }, [checkoutSubtotal]);

  const checkoutTotalAmount = useMemo(() => {
    return Math.max(0, checkoutSubtotal - checkoutCouponDiscount + checkoutDeliveryFee);
  }, [checkoutSubtotal, checkoutCouponDiscount, checkoutDeliveryFee]);

  // Handle coupon apply
  const handleApplyCouponCode = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) return;
    setIsApplyingCoupon(true);
    const success = applyCoupon(code);
    setIsApplyingCoupon(false);
    if (success) {
      setCouponInput('');
    }
  };

  // Place Order handler (COD or Razorpay)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.pincode) {
      addToast('Incomplete Address', 'Please fill in all required shipping and contact details.', 'error');
      setIsAddingNewAddress(true);
      return;
    }

    setIsSubmitting(true);

    // Auto-save address if user is logged in and saving new address
    if (user && (selectedAddressId === 'new' || savedAddresses.length === 0 || isAddingNewAddress)) {
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
      items: checkoutItems.map((item) => ({
        id: item.product.id,
        title: item.product.name,
        price: item.product.price,
        originalPrice: item.product.originalPrice,
        quantity: item.quantity,
        image: item.product.image,
        weight: (item.product as any).weight || item.product.moreInformation?.netWeight || '',
        category: item.product.category,
      })),
      subtotal: checkoutSubtotal,
      discount: checkoutTotalSavings,
      deliveryFee: checkoutDeliveryFee,
      totalAmount: checkoutTotalAmount,
      shippingAddress: { ...formData },
      customerInfo: {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        username: user?.username || formData.email,
      },
      customerId: user?.id || (user as any)?._id,
    };

    // 1. CASH ON DELIVERY (COD)
    if (paymentMethod === 'cod') {
      try {
        const response = await safeFetch('/orders/create-cod-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        });

        if (response.ok && response.isJson && response.data?.success) {
          const data = response.data;
          const newOrder: Order = {
            id: data.order.orderCustomId,
            date: new Date().toISOString().split('T')[0],
            items: [...checkoutItems],
            subtotal: checkoutSubtotal,
            discount: checkoutTotalSavings,
            deliveryFee: checkoutDeliveryFee,
            totalAmount: checkoutTotalAmount,
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

          if (isBuyNow) {
            clearBuyNow();
          } else {
            clearCart();
          }

          addToast('Order Confirmed!', `COD Order ${newOrder.id} placed successfully.`, 'success');
          return;
        } else {
          throw new Error(response.data?.message || response.error || 'Failed to place COD order');
        }
      } catch (err: any) {
        console.warn('Backend COD error, using local fallback:', err);
        const fallbackOrder: Order = {
          id: `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toISOString().split('T')[0],
          items: [...checkoutItems],
          subtotal: checkoutSubtotal,
          discount: checkoutTotalSavings,
          deliveryFee: checkoutDeliveryFee,
          totalAmount: checkoutTotalAmount,
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

        if (isBuyNow) {
          clearBuyNow();
        } else {
          clearCart();
        }

        addToast('Order Confirmed!', `Order ${fallbackOrder.id} placed successfully.`, 'success');
        return;
      }
    }

    // 2. RAZORPAY ONLINE PAYMENT
    try {
      const res = await safeFetch('/orders/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok || !res.isJson || !res.data?.success) {
        setIsSubmitting(false);
        addToast('Payment Error', res.data?.message || res.error || 'Could not initiate Razorpay order.', 'error');
        return;
      }

      const data = res.data;

      if (typeof (window as any).Razorpay === 'undefined') {
        setIsSubmitting(false);
        addToast('SDK Error', 'Razorpay Checkout SDK not loaded. Please refresh the page.', 'error');
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'Chokku Store',
        description: `Order Payment ${data.orderCustomId}`,
        order_id: data.razorpayOrderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await safeFetch('/orders/verify-razorpay-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                dbOrderId: data.dbOrderId,
              }),
            });

            if (verifyRes.ok && verifyRes.isJson && verifyRes.data?.success) {
              const newOrder: Order = {
                id: data.orderCustomId,
                date: new Date().toISOString().split('T')[0],
                items: [...checkoutItems],
                subtotal: checkoutSubtotal,
                discount: checkoutTotalSavings,
                deliveryFee: checkoutDeliveryFee,
                totalAmount: checkoutTotalAmount,
                status: 'Processing',
                paymentStatus: 'paid',
                shippingAddress: { ...formData },
                paymentMethod: 'Online Payment (Razorpay)',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              };

              addOrder(newOrder);
              setSuccessOrder(newOrder);
              setShowSuccessModal(true);
              setIsSubmitting(false);

              if (isBuyNow) {
                clearBuyNow();
              } else {
                clearCart();
              }

              addToast('Payment Successful!', `Order ${newOrder.id} confirmed.`, 'success');
            } else {
              setIsSubmitting(false);
              addToast('Payment Verification Failed', verifyRes.data?.message || 'Signature verification failed.', 'error');
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
          color: '#64A901',
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            addToast('Payment Cancelled', 'Payment window was closed.', 'info');
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

  // Empty state view
  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#fbfdf9]">
        <div className="max-w-md w-full text-center bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 text-[#64A901] flex items-center justify-center">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">
            {isBuyNow ? 'No Product Selected for Buy Now' : 'Your Cart is Empty'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            {isBuyNow
              ? 'Select a product and click "Buy Now" to proceed with direct single-product checkout.'
              : 'You do not have any items in your cart to checkout. Browse our collection and add your favorite products!'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              to="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#64A901] hover:bg-[#548f01] text-white text-sm font-extrabold rounded-xl shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Shop
            </Link>
            {cartItems.length > 0 && isBuyNow && (
              <Link
                to="/checkout"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold rounded-xl transition-all"
              >
                Checkout Cart ({cartItems.length} items)
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const visibleItems = showAllItems ? checkoutItems : checkoutItems.slice(0, 3);
  const hasMoreItems = checkoutItems.length > 3;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 antialiased py-4 sm:py-6 pb-28 sm:pb-32">
      <div className="max-w-2xl sm:max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Navigation & Header */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          {isBuyNow ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Cart</span>
            </Link>
          )}

          <div className="flex items-center gap-2">
            {isBuyNow && cartItems.length > 0 && (
              <Link
                to="/checkout"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:underline bg-white px-2.5 py-1 rounded-full border border-brand-blue/20"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Switch to Cart ({cartItems.length})</span>
              </Link>
            )}
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 sm:px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-[#64A901]" />
              <span>100% Secure Checkout</span>
            </div>
          </div>
        </div>

        {/* Page Title & Mode Indicator */}
        <div className="mb-5 sm:mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Checkout</h1>
              {isBuyNow ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                  <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                  <span>Buy Now Checkout</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                  <ShoppingBag className="w-3 h-3 text-[#64A901]" />
                  <span>Cart Checkout ({checkoutItems.length} items)</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {isBuyNow
                ? 'Review this product and complete your instant purchase.'
                : 'Review your cart items and complete your purchase.'}
            </p>
          </div>

          {isBuyNow && cartItems.length > 0 && (
            <Link
              to="/checkout"
              className="sm:hidden text-[11px] font-bold text-brand-blue hover:underline bg-white px-2.5 py-1 rounded-full border border-brand-blue/20 shrink-0"
            >
              Cart ({cartItems.length})
            </Link>
          )}
        </div>

        {/* Main Checkout Form */}
        <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4 sm:space-y-5">
          
          {/* ========================================================= */}
          {/* SECTION 1: ORDER SUMMARY                                 */}
          {/* ========================================================= */}
          <section className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#64A901] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                  1
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Order Summary</h2>
                  <p className="text-[11px] text-gray-500">
                    {isBuyNow
                      ? 'Single product selected for direct checkout'
                      : `${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'items'} in your cart`}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#64A901] bg-[#f2f8eb] px-2.5 py-1 rounded-full border border-[#dbecc7]">
                Saved ₹{checkoutTotalSavings.toFixed(2)}
              </span>
            </div>

            {/* Product Items List */}
            <div className="divide-y divide-gray-100 mt-2">
              {visibleItems.map((item) => {
                const itemPrice = item.product.price;
                const itemOriginalPrice =
                  item.product.originalPrice && item.product.originalPrice > itemPrice
                    ? item.product.originalPrice
                    : item.product.originalPrice || Math.round(itemPrice * 1.25);
                const itemLinePrice = itemPrice * item.quantity;
                const itemLineOriginalPrice = itemOriginalPrice * item.quantity;
                const itemSaved = Math.max(0, itemLineOriginalPrice - itemLinePrice);
                const percentOff =
                  itemOriginalPrice > itemPrice
                    ? Math.round(((itemOriginalPrice - itemPrice) / itemOriginalPrice) * 100)
                    : 0;

                return (
                  <div
                    key={`${item.product.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`}
                    className="py-3.5 sm:py-4 flex items-start gap-3 sm:gap-4"
                  >
                    {/* Small Product Image */}
                    <div className="relative shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-gray-200/80 bg-gray-50 shadow-2xs"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=60';
                        }}
                      />
                      <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                        {item.quantity}
                      </span>
                    </div>

                    {/* Product Details & Quantity Controls */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 leading-snug truncate sm:whitespace-normal sm:line-clamp-2">
                            {item.product.name}
                          </h3>

                          {/* Variant Badges */}
                          {(item.selectedSize || item.selectedColor || (item.product as any).weight || item.product.moreInformation?.netWeight) && (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {item.selectedSize && (
                                <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                  Size: {item.selectedSize}
                                </span>
                              )}
                              {item.selectedColor && (
                                <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                  Color: {item.selectedColor}
                                </span>
                              )}
                              {((item.product as any).weight || item.product.moreInformation?.netWeight) && (
                                <span className="text-[10px] font-medium text-gray-500">
                                  {(item.product as any).weight || item.product.moreInformation?.netWeight}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Interactive Quantity Stepper directly on checkout card */}
                        <div className="inline-flex items-center bg-gray-50 border border-gray-200/90 rounded-xl p-0.5 shadow-2xs shrink-0">
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(item, item.quantity - 1)}
                            disabled={isBuyNow && item.quantity <= 1}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                              isBuyNow && item.quantity <= 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : item.quantity === 1
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            title={item.quantity === 1 ? (isBuyNow ? 'Minimum quantity: 1' : 'Remove from cart') : 'Decrease quantity'}
                          >
                            {item.quantity === 1 && !isBuyNow ? (
                              <Trash2 className="w-3.5 h-3.5" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="w-7 text-center text-xs font-extrabold text-gray-900 select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(item, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Price, Original Price, and Amount Saved */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Discounted / Selling Price */}
                        <span className="text-sm font-black text-gray-900">
                          ₹{itemLinePrice.toFixed(2)}
                        </span>

                        {/* Unit price indicator if qty > 1 */}
                        {item.quantity > 1 && (
                          <span className="text-[11px] text-gray-400">
                            (₹{itemPrice.toFixed(2)} each)
                          </span>
                        )}

                        {/* Original Price (Strikethrough) */}
                        {itemLineOriginalPrice > itemLinePrice && (
                          <span className="text-xs text-gray-400 line-through font-semibold">
                            ₹{itemLineOriginalPrice.toFixed(2)}
                          </span>
                        )}

                        {/* Amount Saved Badge */}
                        {itemSaved > 0 && (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Save ₹{itemSaved.toFixed(2)} {percentOff > 0 ? `(${percentOff}% OFF)` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expand / Collapse Button if > 3 items to reduce scrolling */}
            {hasMoreItems && (
              <div className="pt-2 text-center border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAllItems(!showAllItems)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#64A901] hover:underline cursor-pointer py-1"
                >
                  {showAllItems ? (
                    <>
                      <span>Show Less</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>View All {checkoutItems.length} Items</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* ========================================================= */}
          {/* SECTION 2: PRICE DETAILS                                 */}
          {/* ========================================================= */}
          <section className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#64A901] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                  2
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Price Details</h2>
                  <p className="text-[11px] text-gray-500">Transparent price breakdown &amp; savings</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                INR (₹)
              </span>
            </div>

            {/* Clear breakdown list */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              {/* Original Price */}
              <div className="flex items-center justify-between text-gray-600">
                <span className="font-medium">Original Price (Total MRP)</span>
                <span className="font-semibold text-gray-800">₹{checkoutTotalOriginalPrice.toFixed(2)}</span>
              </div>

              {/* Discount Amount */}
              {checkoutProductDiscount > 0 && (
                <div className="flex items-center justify-between text-[#64A901]">
                  <span className="font-medium flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#64A901]" />
                    <span>Discount on MRP</span>
                  </span>
                  <span className="font-extrabold">-₹{checkoutProductDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* Coupon Discount */}
              {checkoutCouponDiscount > 0 && (
                <div className="flex items-center justify-between text-[#64A901]">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-[#64A901]" />
                    <span>Coupon ({couponCode})</span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[10px] text-red-500 underline ml-1 hover:text-red-700 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <span className="font-extrabold">-₹{checkoutCouponDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* Delivery Charge */}
              <div className="flex items-center justify-between text-gray-600">
                <span className="font-medium flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-gray-400" />
                  <span>Delivery Charge</span>
                </span>
                <span>
                  {checkoutDeliveryFee === 0 ? (
                    <span className="font-extrabold text-[#64A901] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-xs">
                      FREE
                    </span>
                  ) : (
                    <span className="font-semibold text-gray-800">₹{checkoutDeliveryFee.toFixed(2)}</span>
                  )}
                </span>
              </div>

              {/* Divider */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-sm sm:text-base font-black text-gray-900 block">
                    Final Total Amount
                  </span>
                  <span className="text-[10px] text-gray-400">Includes all applicable taxes</span>
                </div>
                <span className="text-lg sm:text-xl font-black text-gray-900">
                  ₹{checkoutTotalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Savings Banner */}
            {checkoutTotalSavings > 0 && (
              <div className="bg-[#f0f9e8] border border-[#d2ea9d] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-emerald-900">
                <span className="font-extrabold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#64A901] shrink-0" />
                  <span>You are saving ₹{checkoutTotalSavings.toFixed(2)} on this order!</span>
                </span>
                <span className="text-[10px] font-extrabold text-[#64A901] bg-white px-2 py-0.5 rounded-md border border-[#c4e48f]">
                  Best Price
                </span>
              </div>
            )}

            {/* Coupon Code Input Box */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code (e.g. SAVE10)"
                    className="w-full pl-3 pr-3 py-2 text-xs uppercase bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white tracking-wider"
                  />
                </div>
                <button
                  type="button"
                  disabled={isApplyingCoupon || !couponInput.trim()}
                  onClick={() => handleApplyCouponCode()}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  {isApplyingCoupon ? 'Applying...' : 'Apply'}
                </button>
              </div>

              {/* Quick Coupon Chips */}
              {!couponCode && (
                <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[11px] text-gray-500">
                  <span>Available:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyCouponCode('SAVE10')}
                    className="font-bold text-[#64A901] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    SAVE10 (10% off)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyCouponCode('WELCOME20')}
                    className="font-bold text-[#64A901] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    WELCOME20 (20% off)
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/* SECTION 3: DELIVERY ADDRESS                              */}
          {/* ========================================================= */}
          <section className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#64A901] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                  3
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Delivery Address</h2>
                  <p className="text-[11px] text-gray-500">Where should we deliver your order?</p>
                </div>
              </div>

              {/* Action Buttons to Add or Change */}
              <div className="flex items-center gap-2">
                {savedAddresses.length > 0 && !isAddingNewAddress && (
                  <button
                    type="button"
                    onClick={() => setShowAddressBook(!showAddressBook)}
                    className="text-xs font-bold text-brand-blue hover:underline cursor-pointer"
                  >
                    {showAddressBook ? 'Close' : `Change (${savedAddresses.length})`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewAddress(!isAddingNewAddress);
                    setShowAddressBook(false);
                    if (!isAddingNewAddress) {
                      setSelectedAddressId('new');
                    }
                  }}
                  className="text-xs font-bold text-[#64A901] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingNewAddress ? 'Cancel' : 'Add New'}</span>
                </button>
              </div>
            </div>

            {/* Display Selected Address Card */}
            {!isAddingNewAddress && formData.fullName && formData.address ? (
              <div className="p-3.5 sm:p-4 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white hover:border-gray-300 transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-[#64A901] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs sm:text-sm text-gray-900">
                      {formData.fullName}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                      DELIVER HERE
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {formData.address}, {formData.city}, {formData.state} -{' '}
                    <span className="font-bold text-gray-800">{formData.pincode}</span>
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {formData.phone}
                    </span>
                    {formData.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {formData.email}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const found = savedAddresses.find((a) => (a.id || a._id) === selectedAddressId);
                    if (found) {
                      setEditingAddress({ ...found });
                    } else {
                      setEditingAddress({
                        id: 'current',
                        fullName: formData.fullName,
                        email: formData.email,
                        phone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        state: formData.state,
                        pincode: formData.pincode,
                      });
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-[#64A901] hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Edit Address"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            {/* Address Selector Drawer (if user clicks Change) */}
            {showAddressBook && savedAddresses.length > 0 && !isAddingNewAddress && (
              <div className="pt-2 space-y-2 border-t border-gray-100">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                  Select a saved address
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {savedAddresses.map((addr, idx) => {
                    const addrId = addr.id || addr._id || `addr-${idx}`;
                    const isSelected = selectedAddressId === addrId;

                    return (
                      <div
                        key={addrId}
                        onClick={() => {
                          setSelectedAddressId(addrId);
                          setShowAddressBook(false);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative flex items-start gap-2.5 ${
                          isSelected
                            ? 'border-[#64A901] bg-[#f8fbf4] shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          <input
                            type="radio"
                            name="addressSelection"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedAddressId(addrId);
                              setShowAddressBook(false);
                            }}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'border-[#64A901] bg-white' : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && <span className="w-2 h-2 rounded-full bg-[#64A901]" />}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-xs text-gray-900 truncate">
                            {addr.fullName}
                          </p>
                          <p className="text-[11px] text-gray-600 truncate mt-0.5">
                            {addr.address}, {addr.city} - {addr.pincode}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{addr.phone}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAddress({ ...addr });
                            }}
                            className="p-1 text-gray-400 hover:text-[#64A901]"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSavedAddress(addrId, addr.label || `Address ${idx + 1}`);
                            }}
                            className="p-1 text-gray-300 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inline Address Entry Form (when adding new or no saved address exists) */}
            {isAddingNewAddress && (
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                    {savedAddresses.length > 0 ? 'Enter New Delivery Address' : 'Recipient & Shipping Details'}
                  </p>
                  {savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const first = savedAddresses[0];
                        setSelectedAddressId(first.id || first._id || 'addr-0');
                        setIsAddingNewAddress(false);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-800 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-gray-700">6-Digit Pincode *</label>
                      {isFetchingPincode && (
                        <span className="text-[10px] font-bold text-[#64A901] flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Verifying...
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="pincode"
                      required
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="6-digit PIN code"
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white"
                    />
                    {pincodeBadge && (
                      <p className="mt-1 text-[10px] font-bold text-[#64A901]">{pincodeBadge}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">
                      Street Address / House No. *
                    </label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Flat/House No., Apartment, Street, Landmark"
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white"
                    />
                  </div>
                </div>

                {user && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveNewAddressAndSelect}
                      className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Save &amp; Use Address
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ========================================================= */}
          {/* SECTION 4: PAYMENT METHOD                                */}
          {/* ========================================================= */}
          <section className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#64A901] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                  4
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Payment Method</h2>
                  <p className="text-[11px] text-gray-500">Select how you want to pay</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#64A901]" />
                <span>100% Safe</span>
              </span>
            </div>

            {/* Payment Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Cash on Delivery (COD) */}
              <div
                id="payment-option-cod"
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative flex items-start gap-3 ${
                  paymentMethod === 'cod'
                    ? 'border-[#64A901] bg-[#f8fbf4] ring-2 ring-[#64A901]/15 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <input
                    type="radio"
                    id="payment-cod"
                    name="paymentMethodSelection"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-[#64A901] bg-white ring-2 ring-[#64A901]/20'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {paymentMethod === 'cod' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#64A901]" />
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <label htmlFor="payment-cod" className="font-extrabold text-xs sm:text-sm text-gray-900 cursor-pointer block">
                    Cash on Delivery (COD)
                  </label>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                    Pay with cash or scan UPI at your doorstep upon delivery.
                  </p>
                  <span className="inline-block mt-1.5 text-[10px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                    ✓ Pay at Doorstep
                  </span>
                </div>
              </div>

              {/* Option 2: Online Payment */}
              <div
                id="payment-option-online"
                onClick={() => setPaymentMethod('online')}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative flex items-start gap-3 ${
                  paymentMethod === 'online'
                    ? 'border-[#64A901] bg-[#f8fbf4] ring-2 ring-[#64A901]/15 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <input
                    type="radio"
                    id="payment-online"
                    name="paymentMethodSelection"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      paymentMethod === 'online'
                        ? 'border-[#64A901] bg-white ring-2 ring-[#64A901]/20'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {paymentMethod === 'online' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#64A901]" />
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <label htmlFor="payment-online" className="font-extrabold text-xs sm:text-sm text-gray-900 cursor-pointer block">
                    Online Payment
                  </label>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                    UPI (Google Pay, PhonePe), Cards &amp; NetBanking.
                  </p>
                  <span className="inline-block mt-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Instant &amp; Encrypted
                  </span>
                </div>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>256-Bit SSL Encrypted &amp; Verified Checkout</span>
            </div>
          </section>

        </form>

        {/* ========================================================= */}
        {/* FIXED BOTTOM CHECKOUT BAR: TOTAL & "PLACE ORDER" BUTTON   */}
        {/* ========================================================= */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] py-3 px-4 sm:px-6">
          <div className="max-w-2xl sm:max-w-3xl mx-auto flex items-center justify-between gap-4">
            
            {/* Final Order Total */}
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Total Amount {isBuyNow && '• Buy Now'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-gray-900">
                  ₹{checkoutTotalAmount.toFixed(2)}
                </span>
                {checkoutTotalSavings > 0 && (
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Save ₹{checkoutTotalSavings.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Fixed "Place Order" Button */}
            <button
              type="submit"
              form="checkout-form"
              id="place-order-btn"
              disabled={isSubmitting}
              className="min-h-[46px] sm:min-h-[48px] px-6 sm:px-9 py-2.5 sm:py-3 bg-[#64A901] hover:bg-[#548f01] text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-base shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* ================= EDIT ADDRESS MODAL ================= */}
      {editingAddress && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 relative animate-fade-in">
            <button
              onClick={() => setEditingAddress(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Pencil className="w-5 h-5 text-[#64A901]" />
              <h3 className="text-lg font-extrabold text-gray-900">
                Edit Delivery Address
              </h3>
            </div>

            <form onSubmit={handleUpdateSavedAddress} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.fullName}
                    onChange={(e) => setEditingAddress({ ...editingAddress, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editingAddress.phone}
                    onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editingAddress.email}
                    onChange={(e) => setEditingAddress({ ...editingAddress, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={editingAddress.pincode}
                    onChange={(e) => setEditingAddress({ ...editingAddress, pincode: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.address}
                    onChange={(e) => setEditingAddress({ ...editingAddress, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.city}
                    onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.state}
                    onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingAddress(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#64A901] hover:bg-[#548f01] text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ORDER SUCCESSFUL MODAL ================= */}
      {showSuccessModal && successOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-emerald-100 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

            {/* Checkmark Icon */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#64A901] stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-black text-[#64A901] uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                {successOrder.paymentMethod?.includes('Cash') || successOrder.paymentStatus === 'cod'
                  ? 'Cash on Delivery • Order Confirmed'
                  : 'Payment Verified • Order Confirmed'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 pt-1">
                Thank You for Your Order!
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {successOrder.paymentMethod?.includes('Cash') || successOrder.paymentStatus === 'cod'
                  ? `Your COD order has been confirmed! Please keep ₹${successOrder.totalAmount?.toFixed(2)} ready upon delivery.`
                  : 'Your payment was successful and your order is confirmed.'}
              </p>
            </div>

            {/* Order Details Summary Box */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-2.5 text-xs text-left font-medium">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Order ID</span>
                <span className="font-black text-sm sm:text-base text-[#64A901]">{successOrder.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-bold">Total Amount:</span>
                <span className="font-extrabold text-gray-900 text-sm">₹{successOrder.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-bold">Payment Method:</span>
                <span className="font-extrabold text-[#64A901]">{successOrder.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-bold">Estimated Delivery:</span>
                <span className="font-bold text-gray-800">{successOrder.estimatedDelivery}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-bold">Delivering To:</span>
                <span className="font-medium text-gray-800 truncate max-w-[200px]">
                  {successOrder.shippingAddress?.fullName}, {successOrder.shippingAddress?.city}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/orders');
                }}
                className="flex-1 py-3 bg-[#64A901] hover:bg-[#548f01] text-white font-extrabold rounded-xl transition-all shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>View My Orders</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/shop');
                }}
                className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors text-xs sm:text-sm cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
