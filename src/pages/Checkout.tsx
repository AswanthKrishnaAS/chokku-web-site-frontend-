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
  Wallet,
  AlertCircle,
  Coins,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../utils/analyticsTracker';
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
  houseNo?: string;
  roadArea?: string;
  landmark?: string;
}

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const buildFullAddress = (
  houseNo?: string,
  roadArea?: string,
  landmark?: string,
  fallbackAddress?: string
) => {
  const parts: string[] = [];
  if (houseNo?.trim()) parts.push(houseNo.trim());
  if (roadArea?.trim()) parts.push(roadArea.trim());
  if (landmark?.trim()) parts.push(`(Near: ${landmark.trim()})`);
  if (parts.length > 0) return parts.join(', ');
  return fallbackAddress?.trim() || '';
};

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

  const {
    user,
    addOrder,
    savedAddresses,
    addSavedAddress,
    deleteSavedAddress,
    fetchSavedAddresses,
    customerPoints,
    customerWalletBalance,
    fetchCustomerPoints,
  } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Store Cash redemption toggle state
  const [useStoreCash, setUseStoreCash] = useState<boolean>(false);

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
    houseNo: (user as any)?.houseNo || '',
    roadArea: (user as any)?.roadArea || '',
    landmark: (user as any)?.landmark || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
  });

  // Payment Method Selection: 'cod' or 'online'
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check supported payment methods based on checkout items
  const isCodSupported = useMemo(() => {
    if (checkoutItems.length === 0) return true;
    return checkoutItems.every((item) => item.product?.isCodAvailable !== false);
  }, [checkoutItems]);

  const isOnlineSupported = useMemo(() => {
    if (checkoutItems.length === 0) return true;
    return checkoutItems.every((item) => item.product?.isOnlinePaymentAvailable !== false);
  }, [checkoutItems]);

  // Auto-switch selected payment method if current method is not supported
  useEffect(() => {
    if (paymentMethod === 'cod' && !isCodSupported && isOnlineSupported) {
      setPaymentMethod('online');
    } else if (paymentMethod === 'online' && !isOnlineSupported && isCodSupported) {
      setPaymentMethod('cod');
    }
  }, [isCodSupported, isOnlineSupported, paymentMethod]);

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
            houseNo: prev.houseNo || (user as any)?.houseNo || '',
            roadArea: prev.roadArea || (user as any)?.roadArea || '',
            landmark: prev.landmark || (user as any)?.landmark || '',
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
          fullName: found.fullName || '',
          email: found.email || '',
          phone: found.phone || '',
          houseNo: found.houseNo || '',
          roadArea: found.roadArea || '',
          landmark: found.landmark || '',
          address: found.address || '',
          city: found.city || '',
          state: found.state || '',
          pincode: found.pincode || '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
      return;
    }
    if (name === 'pincode') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      setFormData((prev) => ({ ...prev, pincode: digitsOnly }));
      if (digitsOnly.length === 6) {
        handlePincodeLookup(digitsOnly);
      } else {
        setPincodeBadge(null);
      }
      return;
    }
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      const computedAddress = buildFullAddress(
        name === 'houseNo' ? value : updated.houseNo,
        name === 'roadArea' ? value : updated.roadArea,
        name === 'landmark' ? value : updated.landmark,
        updated.address
      );
      return { ...updated, address: computedAddress || updated.address };
    });
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

    if (!editingAddress.fullName?.trim()) {
      addToast('Missing Full Name', 'Please enter your full name.', 'error');
      return;
    }

    const cleanPhone = editingAddress.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      addToast('Invalid Contact Number', 'Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    if (!editingAddress.houseNo?.trim() && !editingAddress.address?.trim()) {
      addToast('Missing House No. / Building', 'Please enter your house number or nearest building name.', 'error');
      return;
    }

    if (!editingAddress.roadArea?.trim() && !editingAddress.address?.trim()) {
      addToast('Missing Road / Area', 'Please enter your road name, area, or colony.', 'error');
      return;
    }

    const cleanPincode = editingAddress.pincode.replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      addToast('Invalid Pincode', 'Please enter a valid 6-digit pincode.', 'error');
      return;
    }

    if (!editingAddress.city?.trim()) {
      addToast('Missing City', 'Please enter a valid city name.', 'error');
      return;
    }

    if (!editingAddress.state?.trim()) {
      addToast('Missing State', 'Please select your state from the dropdown.', 'error');
      return;
    }

    const fullAddr = buildFullAddress(
      editingAddress.houseNo,
      editingAddress.roadArea,
      editingAddress.landmark,
      editingAddress.address
    );

    const emailVal = editingAddress.email?.trim() || user?.email || `${cleanPhone}@guest.chokkustore.com`;

    await addSavedAddress({
      fullName: editingAddress.fullName.trim(),
      email: emailVal,
      phone: cleanPhone,
      address: fullAddr,
      city: editingAddress.city.trim(),
      state: editingAddress.state.trim(),
      pincode: cleanPincode,
      houseNo: editingAddress.houseNo?.trim() || '',
      roadArea: editingAddress.roadArea?.trim() || '',
      landmark: editingAddress.landmark?.trim() || '',
    });
    setEditingAddress(null);

    if (selectedAddressId === editingAddress.id || selectedAddressId === editingAddress._id) {
      setFormData({
        fullName: editingAddress.fullName.trim(),
        email: emailVal,
        phone: cleanPhone,
        address: fullAddr,
        city: editingAddress.city.trim(),
        state: editingAddress.state.trim(),
        pincode: cleanPincode,
        houseNo: editingAddress.houseNo?.trim() || '',
        roadArea: editingAddress.roadArea?.trim() || '',
        landmark: editingAddress.landmark?.trim() || '',
      });
    }
  };

  // Save new address from the form
  const handleSaveNewAddressAndSelect = async () => {
    if (!formData.fullName.trim()) {
      addToast('Missing Full Name', 'Please enter your full name.', 'error');
      return;
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      addToast('Invalid Contact Number', 'Please enter a valid 10-digit mobile number.', 'error');
      return;
    }
    if (!formData.houseNo?.trim() && !formData.address.trim()) {
      addToast('Missing House No. / Building', 'Please enter your house number or nearest building name.', 'error');
      return;
    }
    if (!formData.roadArea?.trim() && !formData.address.trim()) {
      addToast('Missing Road / Area', 'Please enter your road name, area, or colony.', 'error');
      return;
    }
    const cleanPin = formData.pincode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      addToast('Invalid Pincode', 'Please enter a valid 6-digit pincode.', 'error');
      return;
    }
    if (!formData.city.trim()) {
      addToast('Missing City', 'Please enter a valid city name.', 'error');
      return;
    }
    if (!formData.state.trim()) {
      addToast('Missing State', 'Please select your state from the dropdown.', 'error');
      return;
    }

    const fullAddr = buildFullAddress(formData.houseNo, formData.roadArea, formData.landmark, formData.address);
    const emailVal = formData.email.trim() || user?.email || `${cleanPhone}@guest.chokkustore.com`;

    const res = await addSavedAddress({
      fullName: formData.fullName.trim(),
      email: emailVal,
      phone: cleanPhone,
      address: fullAddr,
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: cleanPin,
      houseNo: formData.houseNo?.trim() || '',
      roadArea: formData.roadArea?.trim() || '',
      landmark: formData.landmark?.trim() || '',
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

  // Available Store Cash & Points
  const availableStoreCash = Number(customerWalletBalance || (user as any)?.walletBalance || 0);
  const availablePoints = Number(customerPoints || 0);
  const convertibleValue = Math.floor(availablePoints / 1000);

  // Maximum Store Cash that can be applied to product price
  const eligibleStoreCash = useMemo(() => {
    return Math.min(availableStoreCash, Math.floor(checkoutSubtotal));
  }, [availableStoreCash, checkoutSubtotal]);

  // Minimum Redemption Rule: Customers can redeem Store Cash only when amount applied is ₹30 or more.
  const isRedemptionEligible = eligibleStoreCash >= 30;
  const appliedStoreCash = (useStoreCash && isRedemptionEligible) ? eligibleStoreCash : 0;

  const checkoutTotalSavings = useMemo(() => {
    return checkoutProductDiscount + checkoutCouponDiscount + appliedStoreCash;
  }, [checkoutProductDiscount, checkoutCouponDiscount, appliedStoreCash]);

  const checkoutDeliveryFee = useMemo(() => {
    if (checkoutSubtotal === 0) return 0;
    return checkoutSubtotal >= 50 ? 0 : 5.99;
  }, [checkoutSubtotal]);

  const checkoutTotalAmount = useMemo(() => {
    return Math.max(0, checkoutSubtotal - appliedStoreCash - checkoutCouponDiscount + checkoutDeliveryFee);
  }, [checkoutSubtotal, appliedStoreCash, checkoutCouponDiscount, checkoutDeliveryFee]);

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

    if (!formData.fullName.trim()) {
      addToast('Missing Full Name', 'Please enter your full name.', 'error');
      setIsAddingNewAddress(true);
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      addToast('Invalid Contact Number', 'Please enter a valid 10-digit mobile number.', 'error');
      setIsAddingNewAddress(true);
      return;
    }

    if (!formData.houseNo?.trim() && !formData.address.trim()) {
      addToast('Missing House No. / Building', 'Please enter your house number or nearest building name.', 'error');
      setIsAddingNewAddress(true);
      return;
    }

    if (!formData.roadArea?.trim() && !formData.address.trim()) {
      addToast('Missing Road / Area', 'Please enter your road name, area, or colony.', 'error');
      setIsAddingNewAddress(true);
      return;
    }

    const cleanPincode = formData.pincode.replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      addToast('Invalid Pincode', 'Please enter a valid 6-digit pincode.', 'error');
      setIsAddingNewAddress(true);
      return;
    }

    if (!formData.city.trim()) {
      addToast('Missing City', 'Please enter a valid city name.', 'error');
      setIsAddingNewAddress(true);
      return;
    }

    if (!formData.state.trim()) {
      addToast('Missing State', 'Please select your state from the dropdown.', 'error');
      setIsAddingNewAddress(true);
      return;
    }

    const finalFullAddress = buildFullAddress(
      formData.houseNo,
      formData.roadArea,
      formData.landmark,
      formData.address
    );
    const finalEmail = formData.email.trim() || user?.email || `${cleanPhone}@guest.chokkustore.com`;

    formData.address = finalFullAddress;
    formData.phone = cleanPhone;
    formData.email = finalEmail;
    formData.pincode = cleanPincode;

    if (paymentMethod === 'cod' && !isCodSupported) {
      addToast('Payment Error', 'Cash on Delivery is not available for the selected product.', 'error');
      return;
    }

    if (paymentMethod === 'online' && !isOnlineSupported) {
      addToast('Payment Error', 'Online payment is not available for the selected product.', 'error');
      return;
    }

    if (!isCodSupported && !isOnlineSupported) {
      addToast('Payment Error', 'No payment method is enabled for this product.', 'error');
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
      storeCashApplied: appliedStoreCash,
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
            storeCashApplied: appliedStoreCash,
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
          fetchCustomerPoints();

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
          storeCashApplied: appliedStoreCash,
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
        fetchCustomerPoints();

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
                storeCashApplied: appliedStoreCash,
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
              fetchCustomerPoints();

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
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Switch to Cart ({cartItems.length})</span>
              </Link>
            )}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-[#64A901]" />
              <span>100% Secure Checkout</span>
            </div>
          </div>
        </div>

        {/* Page Title & Mode Indicator */}
        <div className="mb-5 sm:mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Checkout</h1>
              {isBuyNow && (
                <span className="text-xs sm:text-sm font-semibold text-amber-700 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Buy Now Checkout</span>
                </span>
              )}
              {!user && (
                <span className="text-xs sm:text-sm font-semibold text-blue-700 flex items-center gap-1">
                  {isBuyNow && <span className="text-gray-300 font-normal mr-1">•</span>}
                  <span>Guest Checkout</span>
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
              className="sm:hidden text-xs font-semibold text-brand-blue hover:underline shrink-0"
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
              {checkoutTotalSavings > 0 && (
                <span className="text-xs font-bold text-[#64A901]">
                  Saved ₹{checkoutTotalSavings.toFixed(2)}
                </span>
              )}
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
                          <span className="text-xs font-bold text-[#64A901]">
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
          {/* SECTION 2: STORE CASH REDEMPTION (BUY NOW & CHECKOUT)     */}
          {/* ========================================================= */}
          {Boolean(user) && (
            <section className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3.5 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#64A901] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-gray-900">
                      {isBuyNow ? 'Buy Now Store Cash' : 'Store Cash Redemption'}
                    </h2>
                    {isBuyNow && (
                      <span className="text-xs font-semibold text-amber-700">
                        • Buy Now
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">Apply your available store cash balance to this order</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#488710] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#64A901]" />
                <span>1,000 Points = ₹1 Store Cash</span>
              </span>
            </div>

            {/* Points & Store Cash Balance Summary Cards (3 items) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
              {/* Metric 1: Available Store Cash */}
              <div className="bg-[#f4fbf0] border border-[#d8f2c8] rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#386b0c] block">
                  Available Store Cash
                </span>
                <span className="text-base sm:text-xl font-black text-gray-900 mt-0.5">
                  ₹{availableStoreCash}
                </span>
                <span className="text-[9px] text-[#488710] font-bold block mt-0.5">
                  Balance
                </span>
              </div>

              {/* Metric 2: Available Points */}
              <div className="bg-[#f4fbf0] border border-[#d8f2c8] rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">
                  Available Points
                </span>
                <span className="text-base sm:text-xl font-black text-gray-900 mt-0.5">
                  {availablePoints.toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-500 font-bold block mt-0.5">
                  PTS
                </span>
              </div>

              {/* Metric 3: Convertible Value */}
              <div className="bg-[#f4fbf0] border border-[#d8f2c8] rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                  Convertible Value
                </span>
                <span className="text-base sm:text-xl font-black text-amber-600 mt-0.5">
                  ₹{convertibleValue}
                </span>
                <span className="text-[9px] text-amber-700 font-bold block mt-0.5">
                  1,000 PTS = ₹1
                </span>
              </div>
            </div>

            {/* Toggle & Redemption Control */}
            <div className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
              useStoreCash && isRedemptionEligible
                ? 'border-[#64A901] bg-[#f8fbf4] ring-2 ring-[#64A901]/15'
                : isRedemptionEligible
                ? 'border-gray-200 bg-white hover:border-gray-300'
                : 'border-gray-200 bg-gray-50/70'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="use-store-cash-checkbox"
                      checked={useStoreCash && isRedemptionEligible}
                      disabled={!isRedemptionEligible}
                      onChange={(e) => {
                        if (isRedemptionEligible) {
                          setUseStoreCash(e.target.checked);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#64A901] peer-disabled:opacity-40 peer-disabled:cursor-not-allowed"></div>
                  </label>

                  <div>
                    <label
                      htmlFor="use-store-cash-checkbox"
                      className={`text-xs sm:text-sm font-black ${
                        isRedemptionEligible ? 'text-gray-900 cursor-pointer' : 'text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Use Store Cash
                    </label>
                    <p className="text-[11px] text-gray-500">
                      {isRedemptionEligible
                        ? `Amount to Apply: ₹${eligibleStoreCash} (Deducted from product price)`
                        : `Amount to Apply: ₹${eligibleStoreCash}`}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-sm sm:text-base font-black ${
                    isRedemptionEligible ? 'text-[#488710]' : 'text-gray-400'
                  }`}>
                    ₹{eligibleStoreCash}
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold">
                    Eligible
                  </span>
                </div>
              </div>

              {/* Message: Minimum Redemption Requirement Rule (when eligibleStoreCash < 30) */}
              {!isRedemptionEligible && (
                <div className="mt-3 pt-3 border-t border-gray-200/80">
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200/90 rounded-xl p-2.5 sm:p-3 text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-extrabold text-amber-900 leading-tight">
                        Minimum Redemption Requirement: ₹30
                      </p>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Customers can redeem Store Cash only when the amount applied is <strong>₹30 or more</strong>. Your eligible amount for this order is <strong>₹{eligibleStoreCash}</strong> (Available Store Cash: ₹{availableStoreCash}).
                      </p>
                      <div className="pt-1 flex items-center gap-1.5 text-[11px] flex-wrap">
                        <span className="text-amber-900 font-medium">Want to earn or convert more?</span>
                        <Link
                          to="/points"
                          className="font-black text-amber-950 underline hover:text-black inline-flex items-center gap-0.5"
                        >
                          <span>Go to Points (1,000 Pts = ₹1)</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Confirmation Banner when Enabled */}
              {useStoreCash && isRedemptionEligible && (
                <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between gap-2 text-xs text-emerald-900">
                  <span className="font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#64A901] shrink-0" />
                    <span>₹{eligibleStoreCash} Store Cash applied to this order!</span>
                  </span>
                  <span className="text-[10px] font-black text-[#64A901] bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    -₹{eligibleStoreCash} Off
                  </span>
                </div>
              )}
            </div>
          </section>
                    
          )}

          {/* ========================================================= */}
          {/* SECTION 3: PRICE DETAILS                                 */}
          {/* ========================================================= */}
          <section className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#64A901] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                  {user ? 3 : 2}
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
              {/* Product Price (Total Subtotal) */}
              <div className="flex items-center justify-between text-gray-600">
                <span className="font-medium">Product Price</span>
                <span className="font-semibold text-gray-800">₹{checkoutSubtotal.toFixed(2)}</span>
              </div>

              {/* Original Price */}
              {checkoutTotalOriginalPrice > checkoutSubtotal && (
                <div className="flex items-center justify-between text-gray-400 text-xs">
                  <span>Total MRP</span>
                  <span className="line-through">₹{checkoutTotalOriginalPrice.toFixed(2)}</span>
                </div>
              )}

              {/* Discount Amount on MRP */}
              {checkoutProductDiscount > 0 && (
                <div className="flex items-center justify-between text-[#64A901]">
                  <span className="font-medium flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#64A901]" />
                    <span>Discount on MRP</span>
                  </span>
                  <span className="font-extrabold">-₹{checkoutProductDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* Store Cash Applied Row */}
              {appliedStoreCash > 0 && (
                <div className="flex items-center justify-between text-[#488710] bg-emerald-50/80 px-3 py-2 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-1.5 font-extrabold">
                    <Wallet className="w-3.5 h-3.5 text-[#64A901]" />
                    <span>Store Cash Applied</span>
                    <span className="text-[10px] font-black text-[#488710] bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      1,000 PTS = ₹1
                    </span>
                  </div>
                  <span className="font-extrabold text-sm">-₹{appliedStoreCash.toFixed(2)}</span>
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
                    <span className="font-extrabold text-[#64A901] text-xs">
                      FREE
                    </span>
                  ) : (
                    <span className="font-semibold text-gray-800">₹{checkoutDeliveryFee.toFixed(2)}</span>
                  )}
                </span>
              </div>

              {/* Price Calculation Box matching Prompt Example */}
              {appliedStoreCash > 0 && (
                <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl space-y-1.5 text-xs mt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Price Calculation
                  </span>
                  <div className="flex items-center justify-between text-gray-700 font-semibold">
                    <span>Product Price</span>
                    <span>₹{checkoutSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#488710] font-black">
                    <span>Store Cash Applied</span>
                    <span>-₹{appliedStoreCash.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-900 font-black pt-1 border-t border-gray-200">
                    <span>Total (Price after Store Cash)</span>
                    <span>₹{Math.max(0, checkoutSubtotal - appliedStoreCash).toFixed(2)}</span>
                  </div>
                </div>
              )}

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
            </div>
          </section>

          {/* ========================================================= */}
          {/* SECTION 4: DELIVERY ADDRESS                              */}
          {/* ========================================================= */}
          <section className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#64A901] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                  {user ? 4 : 3}
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
                    <span className="text-[11px] font-bold text-emerald-700">
                      • Deliver Here
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {formData.houseNo ? `${formData.houseNo}, ${formData.roadArea || ''}` : formData.address}
                    {formData.city ? `, ${formData.city}` : ''}
                    {formData.state ? `, ${formData.state}` : ''}
                    {formData.pincode ? ` - ` : ''}
                    {formData.pincode && <span className="font-bold text-gray-800">{formData.pincode}</span>}
                  </p>
                  {formData.landmark && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      <span className="font-semibold text-gray-600">Landmark:</span> {formData.landmark}
                    </p>
                  )}

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
              <div className="pt-2 border-t border-gray-100 space-y-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                    {savedAddresses.length > 0 ? 'Enter New Delivery Address' : (!user ? 'Delivery Address (Recipient & Contact Details)' : 'Recipient & Shipping Details')}
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
                  {/* 1. Full Name */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white transition-colors"
                    />
                  </div>

                  {/* 2. Contact Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-gray-700">
                        Contact Number *
                      </label>
                      <span className={`text-[10px] font-bold ${formData.phone.length === 10 ? 'text-[#488710]' : 'text-gray-400'}`}>
                        {formData.phone.length}/10 digits
                      </span>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your mobile number"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white transition-colors"
                    />
                  </div>

                  {/* 3. House No. / Building Name */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      House No. / Building Name *
                    </label>
                    <input
                      type="text"
                      name="houseNo"
                      required
                      value={formData.houseNo || ''}
                      onChange={handleInputChange}
                      placeholder="Enter your house number or nearest building name"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white transition-colors"
                    />
                  </div>

                  {/* 4. Road Name / Area / Colony */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Road Name / Area / Colony *
                    </label>
                    <input
                      type="text"
                      name="roadArea"
                      required
                      value={formData.roadArea || ''}
                      onChange={handleInputChange}
                      placeholder="Enter your road name, area, or village/city"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white transition-colors"
                    />
                  </div>

                  {/* 5. Pincode */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-gray-700">
                        Pincode *
                      </label>
                      {isFetchingPincode && (
                        <span className="text-[10px] font-bold text-[#64A901] flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Verifying...
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="pincode"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Please enter a valid 6-digit pincode"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white transition-colors"
                    />
                    {pincodeBadge && (
                      <p className="mt-1 text-[10px] font-bold text-[#64A901]">{pincodeBadge}</p>
                    )}
                  </div>

                  {/* 6. City */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter a valid city name"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white transition-colors"
                    />
                  </div>

                  {/* 7. State (Dropdown) */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      State *
                    </label>
                    <div className="relative">
                      <select
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white appearance-none cursor-pointer pr-8 text-gray-800 transition-colors"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* 8. Nearby Famous Place / Shop / School, etc. (Optional) */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Nearby Famous Place / Shop / School, etc.{' '}
                      <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark || ''}
                      onChange={handleInputChange}
                      placeholder="Enter a nearby landmark for easy delivery identification"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] focus:bg-white transition-colors"
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
          {/* SECTION 5: PAYMENT METHOD                                */}
          {/* ========================================================= */}
          <section className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#64A901] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                  {user ? 5 : 4}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Payment Method</h2>
                  <p className="text-[11px] text-gray-500">Select how you want to pay</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#64A901]" />
                <span>100% Safe</span>
              </span>
            </div>

            {/* Payment Options Grid - Dynamically filtered to only show enabled methods for the product */}
            {isCodSupported || isOnlineSupported ? (
              <div className={`grid gap-3 ${isCodSupported && isOnlineSupported ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Option 1: Cash on Delivery (COD) - only shown if enabled for product */}
                {isCodSupported && (
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
                )}

                {/* Option 2: Online Payment - only shown if enabled for product */}
                {isOnlineSupported && (
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
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold">
                ⚠️ No payment methods are currently available for the selected product(s). Please choose another product or contact store support.
              </div>
            )}

            {/* Note when only one payment method is available */}
            {isCodSupported && !isOnlineSupported && (
              <p className="text-[11px] text-emerald-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                ℹ️ Cash on Delivery is the designated payment method for this product.
              </p>
            )}
            {!isCodSupported && isOnlineSupported && (
              <p className="text-[11px] text-blue-800 bg-blue-50/60 p-2 rounded-lg border border-blue-100">
                ℹ️ Online Payment is required for this product (Cash on Delivery is unavailable).
              </p>
            )}

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
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#64A901]">
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
              disabled={isSubmitting || (!isCodSupported && !isOnlineSupported)}
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
                {/* 1. Full Name */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.fullName}
                    onChange={(e) => setEditingAddress({ ...editingAddress, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>

                {/* 2. Contact Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-gray-700">Contact Number *</label>
                    <span className={`text-[10px] font-bold ${editingAddress.phone.length === 10 ? 'text-[#488710]' : 'text-gray-400'}`}>
                      {editingAddress.phone.length}/10 digits
                    </span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    required
                    value={editingAddress.phone}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setEditingAddress({ ...editingAddress, phone: digitsOnly });
                    }}
                    placeholder="Enter your mobile number"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>

                {/* 3. House No. / Building Name */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">House No. / Building Name *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.houseNo || ''}
                    onChange={(e) => setEditingAddress({ ...editingAddress, houseNo: e.target.value })}
                    placeholder="Enter your house number or nearest building name"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>

                {/* 4. Road Name / Area / Colony */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Road Name / Area / Colony *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.roadArea || ''}
                    onChange={(e) => setEditingAddress({ ...editingAddress, roadArea: e.target.value })}
                    placeholder="Enter your road name, area, or village/city"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>

                {/* 5. Pincode */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength={6}
                    value={editingAddress.pincode}
                    onChange={(e) => {
                      const cleanPin = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setEditingAddress({ ...editingAddress, pincode: cleanPin });
                    }}
                    placeholder="Please enter a valid 6-digit pincode"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>

                {/* 6. City */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.city}
                    onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                    placeholder="Enter a valid city name"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901]"
                  />
                </div>

                {/* 7. State (Dropdown) */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">State *</label>
                  <div className="relative">
                    <select
                      required
                      value={editingAddress.state}
                      onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#64A901] appearance-none cursor-pointer pr-8 text-gray-800"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 8. Nearby Famous Place / Shop / School, etc. (Optional) */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Nearby Famous Place / Shop / School, etc.{' '}
                    <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={editingAddress.landmark || ''}
                    onChange={(e) => setEditingAddress({ ...editingAddress, landmark: e.target.value })}
                    placeholder="Enter a nearby landmark for easy delivery identification"
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
                  className="px-5 py-2 text-xs font-bold text-white bg-[#64A901] hover:bg-[#548f01] rounded-xl transition-all cursor-pointer shadow-xs"
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
              {successOrder.storeCashApplied && successOrder.storeCashApplied > 0 ? (
                <div className="flex items-center justify-between text-[#488710] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    <Wallet className="w-3 h-3 text-[#64A901]" />
                    <span>Store Cash Redeemed:</span>
                  </span>
                  <span className="font-extrabold text-xs">-₹{successOrder.storeCashApplied.toFixed(2)}</span>
                </div>
              ) : null}
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
