import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  Tags,
  CreditCard,
  Settings,
  LogOut,
  Search,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  Bell,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  UserCheck,
  Truck,
  Globe,
  Upload,
  Image as ImageIcon,
  Loader2,
  Check,
  RefreshCw,
  Sliders,
  Pencil,
  Trash2,
  Gamepad2,
  Gift,
  ChevronDown,
  Zap,
  Trophy,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebsiteSettings, HomeSlideItem } from '../context/WebsiteSettingsContext';
import { useCategories } from '../context/CategoryContext';
import { useProducts } from '../context/ProductContext';
import { useToast } from '../context/ToastContext';
import { useGameSettings, GiftBoxRewardConfig } from '../context/GameSettingsContext';
import { PRODUCTS } from '../data/products';
import { CATEGORIES } from '../data/categories';
import { Product, Order } from '../types';
import chokkuLogo from '../assets/img/chokku.png';
import heroImg from '../assets/img/img.png';
import loginImg from '../assets/img/login.png';
import notificationAudioSound from '../assets/notification.mp3';
import { socket } from '../socket';

interface AdminNotification {
  id: string;
  type: 'order' | 'customer';
  title: string;
  message: string;
  time: string;
  read: boolean;
  linkSection?: 'orders' | 'customers';
}

export const AdminDashboard: React.FC = () => {
  const { adminUser, adminLogout, orders, updateOrderStatus } = useAuth();
  const { navbarLogo, uploadNavbarLogo, setNavbarLogo, homeSliders, saveHomeSliders, uploadSliderImage } = useWebsiteSettings();
  const {
    categories: storeCategories,
    sectionMetaTag,
    sectionTitle,
    sectionDescription,
    addOrUpdateCategory,
    uploadCategoryImage,
    updateSectionHeadings,
    deleteCategory: removeStoreCategory,
  } = useCategories();
  const {
    products: storeProducts,
    addProductOrUpdate,
    uploadProductImages,
    deleteProduct: removeStoreProduct,
  } = useProducts();
  const { addToast } = useToast();
  const { catchTheGiftSettings, isConfigured, createCatchTheGiftSettings, updateCatchTheGiftSettings, resetCatchTheGiftSettings } = useGameSettings();
  const navigate = useNavigate();

  // Selected Section
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'customers' | 'products' | 'orders' | 'categories' | 'payments' | 'settings' | 'website-settings' | 'home-slider' | 'catch-the-gift-settings' | 'catch-the-gift-scores'
  >('dashboard');

  // Sidebar Game dropdown state
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(true);

  // Catch the Gift Game Settings Form States
  const [gameGiftCount, setGameGiftCount] = useState(catchTheGiftSettings.giftCount || 5);
  const [gameCoinCount, setGameCoinCount] = useState(catchTheGiftSettings.coinCount || 10);
  const [gamePointsPerCoin, setGamePointsPerCoin] = useState(catchTheGiftSettings.pointsPerCoin || 10);
  const [gameBombCount, setGameBombCount] = useState(catchTheGiftSettings.bombCount || 3);
  const [gamePointsLossPerBomb, setGamePointsLossPerBomb] = useState(catchTheGiftSettings.pointsLossPerBomb || 20);
  const [gameDurationVal, setGameDurationVal] = useState(catchTheGiftSettings.gameDuration || 25);
  const [gameGiftSpeed, setGameGiftSpeed] = useState(catchTheGiftSettings.giftSpeed || 1.5);
  const [gameCoinSpeed, setGameCoinSpeed] = useState(catchTheGiftSettings.coinSpeed || 2.0);
  const [gameBombSpeed, setGameBombSpeed] = useState(catchTheGiftSettings.bombSpeed || 2.2);

  const [gameGiftBoxes, setGameGiftBoxes] = useState<GiftBoxRewardConfig[]>(() => {
    return catchTheGiftSettings.giftBoxes && catchTheGiftSettings.giftBoxes.length > 0
      ? catchTheGiftSettings.giftBoxes
      : [
          { boxNumber: 1, rewardType: 'coins', coinAmount: 1000 },
          { boxNumber: 2, rewardType: 'coins', coinAmount: 5000 },
          { boxNumber: 3, rewardType: 'product_offer', offerPercentage: 50, productName: 'Special Product', originalPrice: 1000, offerPrice: 500, expiryDays: 7 },
          { boxNumber: 4, rewardType: 'coins', coinAmount: 2500 },
          { boxNumber: 5, rewardType: 'product_offer', offerPercentage: 30, productName: 'Exclusive Product', originalPrice: 1500, offerPrice: 1050, expiryDays: 7 },
        ];
  });

  // Customer Game Scores directory
  const [customerScoresList, setCustomerScoresList] = useState<any[]>([]);

  React.useEffect(() => {
    setGameGiftCount(catchTheGiftSettings.giftCount || 5);
    setGameCoinCount(catchTheGiftSettings.coinCount || 10);
    setGamePointsPerCoin(catchTheGiftSettings.pointsPerCoin || 10);
    setGameBombCount(catchTheGiftSettings.bombCount || 3);
    setGamePointsLossPerBomb(catchTheGiftSettings.pointsLossPerBomb || 20);
    setGameDurationVal(catchTheGiftSettings.gameDuration || 25);
    setGameGiftSpeed(catchTheGiftSettings.giftSpeed || 1.5);
    setGameCoinSpeed(catchTheGiftSettings.coinSpeed || 2.0);
    setGameBombSpeed(catchTheGiftSettings.bombSpeed || 2.2);
    if (catchTheGiftSettings.giftBoxes && catchTheGiftSettings.giftBoxes.length > 0) {
      setGameGiftBoxes(catchTheGiftSettings.giftBoxes);
    }
  }, [catchTheGiftSettings]);

  const handleGiftCountChange = (newCount: number) => {
    const count = Math.max(1, newCount);
    setGameGiftCount(count);

    setGameGiftBoxes((prev) => {
      const nextBoxes = [...prev];
      if (nextBoxes.length < count) {
        for (let i = nextBoxes.length; i < count; i++) {
          nextBoxes.push({
            boxNumber: i + 1,
            rewardType: i % 2 === 0 ? 'coins' : 'product_offer',
            coinAmount: 1000 * (i + 1),
            offerPercentage: 20,
            originalPrice: 1000,
            offerPrice: 800,
            expiryDays: 7,
          });
        }
      } else if (nextBoxes.length > count) {
        return nextBoxes.slice(0, count);
      }
      return nextBoxes;
    });
  };

  const handleBoxRewardTypeChange = (index: number, type: 'coins' | 'product_offer') => {
    setGameGiftBoxes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], rewardType: type };
      return updated;
    });
  };

  const handleBoxFieldChange = (index: number, field: string, value: any) => {
    setGameGiftBoxes((prev) => {
      const updated = [...prev];
      const currentBox = { ...updated[index], [field]: value };

      // Auto-recalculate offer price when original price or offer percentage changes
      if (field === 'offerPercentage' || field === 'originalPrice') {
        const orig = field === 'originalPrice' ? Number(value) : (currentBox.originalPrice || 0);
        const pct = field === 'offerPercentage' ? Number(value) : (currentBox.offerPercentage || 0);
        currentBox.offerPrice = Math.round(orig * (1 - pct / 100));
      }

      updated[index] = currentBox;
      return updated;
    });
  };

  const handleBoxProductSelect = (index: number, productId: string) => {
    const selectedProd = productList.find((p) => p.id === productId);
    if (!selectedProd) return;

    setGameGiftBoxes((prev) => {
      const updated = [...prev];
      const currentBox = updated[index];
      const origPrice = selectedProd.price || 1000;
      const offerPct = currentBox.offerPercentage || 50;
      const calculatedOfferPrice = Math.round(origPrice * (1 - offerPct / 100));

      updated[index] = {
        ...currentBox,
        productId: selectedProd.id,
        productName: selectedProd.name,
        productImage: selectedProd.image,
        originalPrice: origPrice,
        offerPrice: calculatedOfferPrice,
      };
      return updated;
    });
  };

  // Fetch Customer Game Scores from Backend API
  React.useEffect(() => {
    const fetchScores = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_URL}/catch-game/all-scores`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.scores)) {
          setCustomerScoresList(data.scores);
        }
      } catch (err) {
        console.warn('Could not fetch game scores from API:', err);
      }
    };
    if (activeSection === 'catch-the-gift-scores' || activeSection === 'catch-the-gift-settings') {
      fetchScores();
    }
  }, [activeSection]);

  const handleCreateGameSettingsSubmit = async () => {
    if (isConfigured) {
      addToast('Create Disabled', 'Game settings have already been created in MongoDB! Please use Edit mode to update settings.', 'warning');
      return;
    }
    const res = await createCatchTheGiftSettings({
      giftCount: Number(gameGiftCount) || 5,
      giftBoxCount: Number(gameGiftCount) || 5,
      coinCount: Number(gameCoinCount) || 10,
      pointsPerCoin: Number(gamePointsPerCoin) || 10,
      bombCount: Number(gameBombCount) || 3,
      pointsLossPerBomb: Number(gamePointsLossPerBomb) || 20,
      gameDuration: Number(gameDurationVal) || 25,
      giftSpeed: Number(gameGiftSpeed) || 1.5,
      coinSpeed: Number(gameCoinSpeed) || 2.0,
      bombSpeed: Number(gameBombSpeed) || 2.2,
      giftBoxes: gameGiftBoxes,
    });
    if (res.success) {
      addToast('Game Settings Created!', 'Settings created in CatchGame collection. Add button is now disabled.', 'success');
    } else {
      addToast('Create Failed', res.message, 'error');
    }
  };

  const handleSaveGameSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateCatchTheGiftSettings({
      giftCount: Number(gameGiftCount) || 5,
      giftBoxCount: Number(gameGiftCount) || 5,
      coinCount: Number(gameCoinCount) || 10,
      pointsPerCoin: Number(gamePointsPerCoin) || 10,
      bombCount: Number(gameBombCount) || 3,
      pointsLossPerBomb: Number(gamePointsLossPerBomb) || 20,
      gameDuration: Number(gameDurationVal) || 25,
      giftSpeed: Number(gameGiftSpeed) || 1.5,
      coinSpeed: Number(gameCoinSpeed) || 2.0,
      bombSpeed: Number(gameBombSpeed) || 2.2,
      giftBoxes: gameGiftBoxes,
    });
    if (res.success) {
      addToast('Game Settings Updated!', 'Catch Game parameters, coin rules, and bomb rules updated in MongoDB.', 'success');
    } else {
      addToast('Update Saved', 'Saved settings locally.', 'info');
    }
  };

  const handleResetGameSettings = () => {
    resetCatchTheGiftSettings();
    addToast('Reset to Defaults', 'Game settings restored to standard values.', 'info');
  };

  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('All');
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>(() => {
    try {
      const saved = localStorage.getItem('chokku_admin_notifications');
      if (saved) {
        const parsed: AdminNotification[] = JSON.parse(saved);
        return parsed.filter((n) => !n.id.startsWith('test-'));
      }
    } catch {}
    return [];
  });
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  const prevOrdersLengthRef = React.useRef<number>(-1);
  const prevCustomersLengthRef = React.useRef<number>(-1);

  const playNotificationSound = () => {
    try {
      const audio = new Audio(notificationAudioSound);
      audio.volume = 0.8;
      audio.play().catch((err) => {
        console.warn('Audio playback restricted by browser policy:', err);
      });
    } catch (e) {
      console.error('Failed playing notification sound:', e);
    }
  };

  // Sync notifications to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('chokku_admin_notifications', JSON.stringify(adminNotifications));
    } catch (e) {
      console.error('Failed saving admin notifications', e);
    }
  }, [adminNotifications]);

  // Click outside to close notification dropdown
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Selected Order for viewing complete Razorpay payment and delivery details modal
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // Real-time WebSocket Notification listeners for instant order & customer alerts
  React.useEffect(() => {
    const handleSocketOrder = (newOrd: Order) => {
      const newNotif: AdminNotification = {
        id: `notif-ord-${Date.now()}`,
        type: 'order',
        title: '📦 New Order Received!',
        message: `Order #${newOrd.id} placed by ${newOrd.shippingAddress?.fullName || 'Customer'} (₹${newOrd.totalAmount.toFixed(2)})`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        linkSection: 'orders',
      };
      setAdminNotifications((prev) => [newNotif, ...prev]);
      setAdminOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === newOrd.id || (newOrd.razorpayOrderId && o.razorpayOrderId === newOrd.razorpayOrderId));
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...newOrd };
          return updated;
        }
        return [newOrd, ...prev];
      });
      playNotificationSound();
      addToast('New Order Received!', `Order #${newOrd.id} placed for ₹${newOrd.totalAmount.toFixed(2)}`, 'success');
    };

    const handleSocketPaymentUpdate = (updatedOrd: Order) => {
      setAdminOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === updatedOrd.id || (updatedOrd.razorpayOrderId && o.razorpayOrderId === updatedOrd.razorpayOrderId));
        if (idx !== -1) {
          const list = [...prev];
          list[idx] = { ...list[idx], ...updatedOrd };
          return list;
        }
        return [updatedOrd, ...prev];
      });
      playNotificationSound();
      addToast('Razorpay Payment Recorded!', `Payment of ₹${updatedOrd.totalAmount.toFixed(2)} recorded for Order ${updatedOrd.id}`, 'success');
    };

    const handleSocketCustomer = (newCust: any) => {
      const newNotif: AdminNotification = {
        id: `notif-cust-${Date.now()}`,
        type: 'customer',
        title: '👤 New Customer Registered!',
        message: `${newCust.name || newCust.username} (${newCust.phone || 'New User'}) registered an account.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        linkSection: 'customers',
      };
      setAdminNotifications((prev) => [newNotif, ...prev]);
      setRegisteredCustomersList((prev) => {
        if (prev.some((c) => c.phone === newCust.phone || c.id === newCust.id)) return prev;
        return [newCust, ...prev];
      });
      playNotificationSound();
      addToast('New Customer Registered!', `${newCust.name || newCust.username} joined Chokku Store`, 'info');
    };

    socket.on('admin_new_order', handleSocketOrder);
    socket.on('admin_payment_update', handleSocketPaymentUpdate);
    socket.on('admin_new_customer', handleSocketCustomer);

    return () => {
      socket.off('admin_new_order', handleSocketOrder);
      socket.off('admin_payment_update', handleSocketPaymentUpdate);
      socket.off('admin_new_customer', handleSocketCustomer);
    };
  }, []);

  // Fetch admin orders from MongoDB backend API
  React.useEffect(() => {
    const fetchAdminOrders = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_URL}/orders/admin/all`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.orders)) {
          setAdminOrders(data.orders);
          localStorage.setItem('chokku_all_orders', JSON.stringify(data.orders));
        }
      } catch (err) {
        console.warn('Could not fetch admin orders from API:', err);
      }
    };
    fetchAdminOrders();
  }, []);

  const handleTestNotification = () => {
    playNotificationSound();
    const testNotif: AdminNotification = {
      id: `test-${Date.now()}`,
      type: 'order',
      title: '📦 Test Order Notification',
      message: 'Audio notification sound test played successfully!',
      time: 'Just now',
      read: false,
      linkSection: 'orders',
    };
    setAdminNotifications((prev) => [testNotif, ...prev]);
    addToast('Audio Sound Tested!', 'Played notification.mp3', 'success');
  };

  // Local state for products
  const [productList, setProductList] = useState<Product[]>(PRODUCTS);

  // Local state for orders (loaded dynamically from master store orders)
  const [adminOrders, setAdminOrders] = useState<Order[]>(() => {
    try {
      const masterSaved = localStorage.getItem('chokku_all_orders');
      if (masterSaved) {
        return JSON.parse(masterSaved);
      }
    } catch (e) {
      console.error('Failed reading admin orders from storage', e);
    }
    return orders || [];
  });

  // Sync adminOrders with Context / Storage
  React.useEffect(() => {
    try {
      const masterSaved = localStorage.getItem('chokku_all_orders');
      if (masterSaved) {
        setAdminOrders(JSON.parse(masterSaved));
      } else if (orders.length > 0) {
        setAdminOrders(orders);
      } else {
        setAdminOrders([]);
      }
    } catch {
      setAdminOrders([]);
    }
  }, [orders]);

  // Registered Customers Directory state (dynamically fetched from Customer collection)
  const [registeredCustomersList, setRegisteredCustomersList] = useState([
    { id: 'u-101', name: 'John Doe', username: 'johndoe', email: 'john.doe@example.com', phone: '+91 9876543210', gender: 'Male', role: 'customer', date: '2026-08-01', status: 'Active' },
    { id: 'u-102', name: 'Aswanth', username: 'aswanth', email: 'aswanth@example.com', phone: '+91 7510159048', gender: 'Male', role: 'customer', date: '2026-08-05', status: 'Active' },
    { id: 'u-103', name: 'Rahul Sharma', username: 'rahul_s', email: 'rahul@example.com', phone: '+91 9123456789', gender: 'Male', role: 'customer', date: '2026-08-08', status: 'Active' },
  ]);

  React.useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_URL}/auth/customers`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.customers)) {
          setRegisteredCustomersList(data.customers);
        }
      } catch (err) {
        console.error('Failed to fetch customers from API:', err);
      }
    };
    fetchCustomers();
  }, []);

  // Payments List dynamically derived from actual customer orders
  const paymentsList = adminOrders.map((ord, idx) => ({
    id: `PAY-${901 + idx}`,
    orderId: ord.id,
    customer: ord.shippingAddress?.fullName || 'Customer',
    amount: `₹${ord.totalAmount.toFixed(2)}`,
    method: ord.paymentMethod || 'Online Payment',
    date: ord.date,
    status: ord.status === 'Cancelled' ? 'Failed' : ord.paymentMethod?.includes('Cash') ? 'Pending' : 'Successful',
  }));

  const handleUpdateOrderStatus = (orderId: string, newStatus: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled') => {
    updateOrderStatus(orderId, newStatus);
    setAdminOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
      try {
        localStorage.setItem('chokku_all_orders', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save updated admin orders', e);
      }
      return updated;
    });
    addToast('Status Updated', `Order ${orderId} status changed to ${newStatus}`, 'success');
  };

  const handleToggleStock = (productId: string) => {
    setProductList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: p.stock > 0 ? 0 : 15 } : p))
    );
  };

  const handleAdminLogout = () => {
    adminLogout();
    navigate('/admin-login');
  };

  const filteredProducts = productList.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = registeredCustomersList.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.username.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const filteredOrders = adminOrders.filter((o) =>
    orderFilter === 'All' ? true : o.status === orderFilter
  );

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        addToast('Invalid File', 'Please select an image file (PNG, JPG, SVG, WebP)', 'error');
        return;
      }
      setSelectedLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogoFile) {
      addToast('No File Selected', 'Please select a logo image to upload', 'error');
      return;
    }

    setIsUploadingLogo(true);
    const result = await uploadNavbarLogo(selectedLogoFile);
    setIsUploadingLogo(false);

    if (result.success) {
      addToast('Logo Uploaded Successfully!', 'The website navbar logo has been updated and uploaded to storage.', 'success');
      setSelectedLogoFile(null);
      setLogoPreview(null);
    } else {
      addToast('Upload Failed', result.message || 'Error uploading logo to server/storage', 'error');
    }
  };

  // ------------------- HOMEPAGE HERO SLIDER STATE & HANDLERS -------------------
  const [sliderViewMode, setSliderViewMode] = useState<'list' | 'form'>('list');
  const [slideEditId, setSlideEditId] = useState<string | null>(null);
  const [slideMetaTag, setSlideMetaTag] = useState('SPECIAL OFFER');
  const [slideHeading, setSlideHeading] = useState('SHOP. PLAY. EARN REWARDS!');
  const [slideSubheading, setSlideSubheading] = useState('Shop your favorites, play fun games and earn exciting rewards every day!');
  const [slideButtonText, setSlideButtonText] = useState('Shop Now');
  const [slideButtonLink, setSlideButtonLink] = useState('/shop');
  const [slideStatus, setSlideStatus] = useState<'Active' | 'Inactive'>('Active');
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [slidePreview, setSlidePreview] = useState<string | null>(null);
  const [isSavingSlider, setIsSavingSlider] = useState(false);

  // Default fallback slides if database is empty
  const activeSlides: HomeSlideItem[] = homeSliders.length > 0 ? homeSliders : [
    {
      id: 'slide-1',
      image: heroImg,
      metaTag: 'EXCLUSIVE DEAL',
      heading: 'SHOP. PLAY. EARN REWARDS!',
      subheading: 'Shop your favorites, play fun games and earn exciting rewards every day!',
      buttonText: 'Shop Now',
      buttonLink: '/shop',
      status: 'Active',
    },
    {
      id: 'slide-2',
      image: heroImg,
      metaTag: 'SPECIAL SUMMER OFFER',
      heading: 'FRESH & ORGANIC GROCERIES',
      subheading: 'Get up to 30% OFF on all fresh fruits, vegetables, and daily essentials!',
      buttonText: 'Explore Offers',
      buttonLink: '/shop',
      status: 'Active',
    },
  ];

  const handleSlideFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        addToast('Invalid File', 'Please select an image file for the banner slide', 'error');
        return;
      }
      setSlideFile(file);
      setSlidePreview(URL.createObjectURL(file));
    }
  };

  const handleOpenAddBanner = () => {
    setSlideEditId(null);
    setSlideMetaTag('SPECIAL OFFER');
    setSlideHeading('');
    setSlideSubheading('');
    setSlideButtonText('Shop Now');
    setSlideButtonLink('/shop');
    setSlideStatus('Active');
    setSlideFile(null);
    setSlidePreview(null);
    setSliderViewMode('form');
  };

  const handleEditSlide = (slide: HomeSlideItem) => {
    setSlideEditId(slide.id);
    setSlideMetaTag(slide.metaTag || 'SPECIAL OFFER');
    setSlideHeading(slide.heading || '');
    setSlideSubheading(slide.subheading || '');
    setSlideButtonText(slide.buttonText || 'Shop Now');
    setSlideButtonLink(slide.buttonLink || '/shop');
    setSlideStatus(slide.status || 'Active');
    setSlidePreview(slide.image || heroImg);
    setSlideFile(null);
    setSliderViewMode('form');
  };

  const handleToggleSlideStatus = async (slideId: string) => {
    const updatedSlides = activeSlides.map((s) =>
      s.id === slideId
        ? { ...s, status: (s.status === 'Inactive' ? 'Active' : 'Inactive') as 'Active' | 'Inactive' }
        : s
    );
    const saveRes = await saveHomeSliders(updatedSlides);
    if (saveRes.success) {
      addToast('Status Updated', 'Banner status has been toggled.', 'info');
    }
  };

  const handleSaveSlideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideHeading.trim() || !slideSubheading.trim()) {
      addToast('Missing Required Fields', 'Please fill in both Heading and Sub-Heading', 'error');
      return;
    }

    setIsSavingSlider(true);
    let finalImageUrl = slidePreview || heroImg;

    if (slideFile) {
      const uploadRes = await uploadSliderImage(slideFile);
      if (uploadRes.success && uploadRes.imageUrl) {
        finalImageUrl = uploadRes.imageUrl;
      } else {
        addToast('Upload Failed', uploadRes.message || 'Error uploading banner image file', 'error');
        setIsSavingSlider(false);
        return;
      }
    }

    let updatedSlides: HomeSlideItem[] = [];
    if (slideEditId) {
      // Update existing slide
      updatedSlides = activeSlides.map((s) =>
        s.id === slideEditId
          ? {
              ...s,
              image: finalImageUrl,
              metaTag: slideMetaTag.trim(),
              heading: slideHeading.trim(),
              subheading: slideSubheading.trim(),
              buttonText: slideButtonText.trim(),
              buttonLink: slideButtonLink.trim(),
              status: slideStatus,
            }
          : s
      );
    } else {
      // Create new slide
      const newSlide: HomeSlideItem = {
        id: 'slide-' + Date.now(),
        image: finalImageUrl,
        metaTag: slideMetaTag.trim(),
        heading: slideHeading.trim(),
        subheading: slideSubheading.trim(),
        buttonText: slideButtonText.trim(),
        buttonLink: slideButtonLink.trim(),
        status: slideStatus,
      };
      updatedSlides = [newSlide, ...activeSlides];
    }

    const saveRes = await saveHomeSliders(updatedSlides);
    setIsSavingSlider(false);

    if (saveRes.success) {
      addToast('Homepage Banner Saved!', 'Banner slide has been saved successfully.', 'success');
      setSliderViewMode('list');
    } else {
      addToast('Save Failed', saveRes.message || 'Error saving banner to database', 'error');
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm('Are you sure you want to delete this homepage slider banner?')) return;
    const updatedSlides = activeSlides.filter((s) => s.id !== slideId);
    const saveRes = await saveHomeSliders(updatedSlides);
    if (saveRes.success) {
      addToast('Slide Removed', 'Banner slide has been deleted.', 'info');
    }
  };

  // ------------------- STORE CATEGORIES STATE & HANDLERS -------------------
  const [editMetaTag, setEditMetaTag] = useState(sectionMetaTag);
  const [editSectionTitle, setEditSectionTitle] = useState(sectionTitle);
  const [editSectionDescription, setEditSectionDescription] = useState(sectionDescription);
  const [isSavingHeadings, setIsSavingHeadings] = useState(false);

  const [showCatModal, setShowCatModal] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catStatus, setCatStatus] = useState<'Active' | 'Inactive'>('Active');
  const [catFile, setCatFile] = useState<File | null>(null);
  const [catPreview, setCatPreview] = useState<string | null>(null);
  const [isSavingCat, setIsSavingCat] = useState(false);

  React.useEffect(() => {
    setEditMetaTag(sectionMetaTag);
    setEditSectionTitle(sectionTitle);
    setEditSectionDescription(sectionDescription);
  }, [sectionMetaTag, sectionTitle, sectionDescription]);

  const handleSaveHeadingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHeadings(true);
    const res = await updateSectionHeadings(editMetaTag, editSectionTitle, editSectionDescription);
    setIsSavingHeadings(false);
    if (res.success) {
      addToast('Headings Saved!', 'Category section meta tag heading and title updated successfully.', 'success');
    } else {
      addToast('Save Failed', res.message || 'Error updating headings', 'error');
    }
  };

  const handleCatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        addToast('Invalid File', 'Please select an image file for the category banner', 'error');
        return;
      }
      setCatFile(file);
      setCatPreview(URL.createObjectURL(file));
    }
  };

  const handleOpenAddCat = () => {
    setCatEditId(null);
    setCatName('');
    setCatDescription('');
    setCatStatus('Active');
    setCatFile(null);
    setCatPreview(null);
    setShowCatModal(true);
  };

  const handleEditCat = (cat: any) => {
    setCatEditId(cat.id);
    setCatName(cat.name || '');
    setCatDescription(cat.description || '');
    setCatStatus(cat.status || 'Active');
    setCatPreview(cat.image || null);
    setCatFile(null);
    setShowCatModal(true);
  };

  const handleSaveCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      addToast('Missing Required Field', 'Please enter Category Name', 'error');
      return;
    }

    setIsSavingCat(true);
    let finalImageUrl = catPreview || '';

    if (catFile) {
      const uploadRes = await uploadCategoryImage(catFile);
      if (uploadRes.success && uploadRes.imageUrl) {
        finalImageUrl = uploadRes.imageUrl;
      } else {
        addToast('Upload Failed', uploadRes.message || 'Error uploading category image', 'error');
        setIsSavingCat(false);
        return;
      }
    }

    const saveRes = await addOrUpdateCategory({
      id: catEditId || undefined,
      name: catName.trim(),
      description: catDescription.trim(),
      image: finalImageUrl,
      status: catStatus,
    });
    setIsSavingCat(false);

    if (saveRes.success) {
      addToast('Category Saved!', 'Store category has been saved successfully.', 'success');
      setShowCatModal(false);
    } else {
      addToast('Save Failed', saveRes.message || 'Error saving category', 'error');
    }
  };

  const handleDeleteCat = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this store category?')) return;
    const res = await removeStoreCategory(categoryId);
    if (res.success) {
      addToast('Category Deleted', 'Store category has been removed.', 'info');
    }
  };

  // ------------------- STORE PRODUCTS STATE & HANDLERS -------------------
  const [prodEditId, setProdEditId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodOriginalPrice, setProdOriginalPrice] = useState<string>('99.99');
  const [prodSellingPrice, setProdSellingPrice] = useState<string>('79.99');
  const [prodDiscountTag, setProdDiscountTag] = useState('SAVE 20%');
  const [prodDescription, setProdDescription] = useState('');
  const [prodIsFeatured, setProdIsFeatured] = useState(true);
  const [prodIsNewArrival, setProdIsNewArrival] = useState(true);
  const [prodIsBestSeller, setProdIsBestSeller] = useState(false);

  // 1 to 7 image files & preview URLs
  const [prodFiles, setProdFiles] = useState<File[]>([]);
  const [prodPreviews, setProdPreviews] = useState<string[]>([]);

  // Technical Specifications Key-Value rows
  const [prodSpecs, setProdSpecs] = useState<{ key: string; value: string }[]>([
    { key: 'Brand', value: '' },
    { key: 'Warranty', value: '1 Year' },
  ]);

  const [isSavingProd, setIsSavingProd] = useState(false);

  const handleProductFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedList = (Array.from(e.target.files) as File[]).filter((file) => file.type.startsWith('image/'));
      if (selectedList.length === 0) {
        addToast('Invalid Files', 'Please select valid image files', 'error');
        return;
      }
      // Max 7 images
      const max7Files = selectedList.slice(0, 7);
      setProdFiles(max7Files);
      const previewUrls = max7Files.map((file) => URL.createObjectURL(file));
      setProdPreviews(previewUrls);
    }
  };

  const handleAddSpecRow = () => {
    setProdSpecs([...prodSpecs, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setProdSpecs(prodSpecs.filter((_, idx) => idx !== index));
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...prodSpecs];
    updated[index][field] = val;
    setProdSpecs(updated);
  };

  const handleOpenAddProd = () => {
    setProdEditId(null);
    setProdName('');
    setProdCategory(storeCategories[0]?.slug || 'electronics');
    setProdStock(10);
    setProdOriginalPrice('99.99');
    setProdSellingPrice('79.99');
    setProdDiscountTag('SAVE 20%');
    setProdDescription('');
    setProdIsFeatured(true);
    setProdIsNewArrival(true);
    setProdIsBestSeller(false);
    setProdFiles([]);
    setProdPreviews([]);
    setProdSpecs([{ key: 'Brand', value: '' }, { key: 'Warranty', value: '1 Year' }]);
    setShowAddProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setProdEditId(product.id);
    setProdName(product.name || '');
    setProdCategory(product.category || storeCategories[0]?.slug || 'electronics');
    setProdStock(product.stock !== undefined ? product.stock : 10);
    setProdOriginalPrice(product.originalPrice ? product.originalPrice.toString() : product.price.toString());
    setProdSellingPrice(product.price ? product.price.toString() : '0');
    setProdDiscountTag(product.discountTag || '');
    setProdDescription(product.description || '');
    setProdIsFeatured(Boolean(product.isFeatured));
    setProdIsNewArrival(Boolean(product.isNewArrival));
    setProdIsBestSeller(Boolean(product.isBestSeller));
    setProdFiles([]);
    setProdPreviews(product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages : product.image ? [product.image] : []);

    // Parse specs
    if (product.specifications && typeof product.specifications === 'object') {
      const specList = Object.entries(product.specifications).map(([key, value]) => ({ key, value }));
      setProdSpecs(specList.length > 0 ? specList : [{ key: 'Brand', value: '' }]);
    } else {
      setProdSpecs([{ key: 'Brand', value: '' }]);
    }

    setShowAddProductModal(true);
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodSellingPrice) {
      addToast('Missing Required Fields', 'Please enter Product Name and Selling Price', 'error');
      return;
    }

    setIsSavingProd(true);
    let finalGalleryImages: string[] = [...prodPreviews];

    // Upload new image files if selected
    if (prodFiles.length > 0) {
      const uploadRes = await uploadProductImages(prodFiles);
      if (uploadRes.success && Array.isArray(uploadRes.imageUrls) && uploadRes.imageUrls.length > 0) {
        finalGalleryImages = uploadRes.imageUrls;
      } else {
        addToast('Images Upload Failed', uploadRes.message || 'Error uploading product images', 'error');
        setIsSavingProd(false);
        return;
      }
    }

    // Build specs object
    const specMap: Record<string, string> = {};
    prodSpecs.forEach((s) => {
      if (s.key.trim()) {
        specMap[s.key.trim()] = s.value.trim();
      }
    });

    const categoryObj = storeCategories.find((c) => c.slug === prodCategory);
    const categoryName = categoryObj ? categoryObj.name : 'General';

    const saveRes = await addProductOrUpdate({
      id: prodEditId || undefined,
      name: prodName.trim(),
      category: prodCategory || 'general',
      categoryName,
      price: Number(prodSellingPrice) || 0,
      originalPrice: Number(prodOriginalPrice) || Number(prodSellingPrice) || 0,
      discountTag: prodDiscountTag.trim(),
      description: prodDescription.trim(),
      stock: Number(prodStock) || 0,
      specifications: specMap,
      image: finalGalleryImages[0] || '',
      galleryImages: finalGalleryImages,
      isFeatured: prodIsFeatured,
      isNewArrival: prodIsNewArrival,
      isBestSeller: prodIsBestSeller,
    });
    setIsSavingProd(false);

    if (saveRes.success) {
      addToast('Product Saved!', 'Store product has been saved successfully.', 'success');
      setShowAddProductModal(false);
    } else {
      addToast('Save Failed', saveRes.message || 'Error saving product', 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product from store catalog?')) return;
    const res = await removeStoreProduct(productId);
    if (res.success) {
      addToast('Product Deleted', 'Product has been removed.', 'info');
    }
  };

  const navMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users, badge: registeredCustomersList.length.toString() },
    { id: 'home-slider', label: 'Homepage Slider', icon: Sliders, badge: activeSlides.length.toString() },
    { id: 'products', label: 'Products', icon: Package, badge: storeProducts.length.toString() },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: adminOrders.length.toString() },
    { id: 'categories', label: 'Categories', icon: Tags, badge: storeCategories.length.toString() },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'website-settings', label: 'Website Settings', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* TOP HEADER BAR */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Left: Mobile Drawer Button & Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-2.5">
              <img src={chokkuLogo} alt="Chokku Store Logo" className="h-10 w-auto object-contain" />
              <div className="h-6 w-px bg-gray-200 hidden sm:block" />
              <span className="bg-[#eaf8dd] text-[#488710] text-xs font-black px-2.5 py-0.5 rounded-full border border-[#d2ea9d] uppercase tracking-wider hidden sm:inline-block">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Center Search Input */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4 relative">
            <input
              type="text"
              placeholder="Search products, orders, customers..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          {/* Right Action Icons & Admin Profile */}
          <div className="flex items-center gap-3">
            
            {/* View User Website Link */}
            <button
              onClick={() => navigate('/')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:text-[#609f00] hover:bg-[#f0f9e8] transition-colors border border-gray-200"
              title="Open Storefront"
            >
              <span>Main Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {adminNotifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Popover Dropdown */}
              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 p-4 z-50 animate-slide-down">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#609f00]" />
                      <h4 className="font-extrabold text-gray-900 text-sm">Admin Notifications</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {adminNotifications.filter((n) => !n.read).length > 0 && (
                        <button
                          onClick={() => setAdminNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                          className="text-[10px] font-bold text-[#609f00] hover:underline cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {adminNotifications.filter((n) => !n.read).length} Unread
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {adminNotifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 font-medium text-xs space-y-1">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
                        <p className="font-bold text-gray-700">No Admin Notifications</p>
                        <p className="text-[11px] text-gray-400">New customer orders & registrations will sound here.</p>
                      </div>
                    ) : (
                      adminNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setAdminNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
                            setIsNotifDropdownOpen(false);
                            if (n.linkSection) setActiveSection(n.linkSection);
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            n.read
                              ? 'bg-gray-50/70 border-gray-100'
                              : 'bg-[#f0f9e8]/90 border-[#d2ea9d] shadow-2xs'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-base shrink-0 shadow-2xs">
                            {n.type === 'order' ? '📦' : '👤'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-gray-900 leading-tight">{n.title}</p>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{n.message}</p>
                            <span className="text-[9px] font-semibold text-gray-400 mt-1 block">{n.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-gray-200" />

            {/* Admin Avatar */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#609f00] text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <p className="font-bold text-gray-900 leading-none">{adminUser?.name || 'Chokku Admin'}</p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{adminUser?.email || 'chokku@store.com'}</p>
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* BODY CONTENT WITH LEFT SIDEBAR */}
      <div className="flex-1 flex max-w-full">
        
        {/* ================= DESKTOP & MOBILE LEFT SIDEBAR ================= */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col justify-between transition-transform duration-300 transform ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4 space-y-6">
            
            {/* Sidebar Label */}
            <div className="px-3 pt-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>Navigation Menu</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1">
              {navMenuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id as any);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#f0f9e8] text-[#488710] font-extrabold shadow-2xs border border-[#d2ea9d]/60'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#488710]' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-[#609f00] text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* GAME MENU DROPDOWN ITEM */}
              <div className="pt-1">
                <button
                  onClick={() => setIsGameMenuOpen(!isGameMenuOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    activeSection === 'catch-the-gift-settings' || activeSection === 'catch-the-gift-scores'
                      ? 'bg-[#f0f9e8] text-[#488710] font-extrabold shadow-2xs border border-[#d2ea9d]/60'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Gamepad2 className={`w-4 h-4 ${activeSection === 'catch-the-gift-settings' || activeSection === 'catch-the-gift-scores' ? 'text-[#488710]' : 'text-gray-400'}`} />
                    <span>Game</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#488710]">
                      2
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isGameMenuOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Submenu Dropdown List */}
                {isGameMenuOpen && (
                  <div className="ml-4 pl-3 border-l-2 border-[#d2ea9d] mt-1 space-y-1 animate-slide-down">
                    <button
                      onClick={() => {
                        setActiveSection('catch-the-gift-settings');
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeSection === 'catch-the-gift-settings'
                          ? 'bg-[#488710] text-white shadow-xs'
                          : 'text-gray-600 hover:text-[#488710] hover:bg-[#f0f9e8]'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Catch the Gift</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveSection('catch-the-gift-scores');
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeSection === 'catch-the-gift-scores'
                          ? 'bg-[#488710] text-white shadow-xs'
                          : 'text-gray-600 hover:text-[#488710] hover:bg-[#f0f9e8]'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Customer Scores</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>

          </div>

          {/* Sidebar Footer Logout Option */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleAdminLogout}
              className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-extrabold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Admin</span>
            </button>
          </div>

        </aside>

        {/* Backdrop overlay for mobile drawer */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        {/* ================= MAIN DASHBOARD CONTENT AREA ================= */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          
          {/* ================= SUMMARY STATISTIC CARDS (4 METRICS) ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Stat 1: Total Customers */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Customers</span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-black text-gray-900">{registeredCustomersList.length}</h3>
                <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  +14 today
                </span>
              </div>
            </div>

            {/* Stat 2: Total Orders */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-black text-gray-900">{adminOrders.length}</h3>
                <span className="text-[11px] font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                  {adminOrders.filter((o) => o.status === 'Processing').length} Pending
                </span>
              </div>
            </div>

            {/* Stat 3: Total Products */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Products</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#488710] border border-emerald-100 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-black text-gray-900">{productList.length}</h3>
                <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  100% In Stock
                </span>
              </div>
            </div>

            {/* Stat 4: Total Sales */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sales</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-black text-gray-900">
                  ₹{adminOrders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.totalAmount : 0), 0).toFixed(2)}
                </h3>
                <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  +18.4%
                </span>
              </div>
            </div>

          </div>

          {/* ================= SECTION 1: DASHBOARD OVERVIEW ================= */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Sales & Orders Charts Container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Sales Activity Bar Chart */}
                <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">Sales Activity & Revenue Trend</h3>
                      <p className="text-xs text-gray-500">Monthly breakdown of completed orders</p>
                    </div>
                    <span className="text-xs font-bold text-[#488710] bg-[#f0f9e8] px-3 py-1 rounded-full border border-[#d2ea9d]">
                      2026 Overview
                    </span>
                  </div>

                  {/* HTML/SVG Bar Chart */}
                  <div className="pt-6 pb-2 h-56 flex items-end justify-between gap-3 px-2 border-b border-gray-100">
                    {[
                      { month: 'Jan', val: 40 },
                      { month: 'Feb', val: 55 },
                      { month: 'Mar', val: 65 },
                      { month: 'Apr', val: 50 },
                      { month: 'May', val: 80 },
                      { month: 'Jun', val: 75 },
                      { month: 'Jul', val: 90 },
                      { month: 'Aug', val: 100 },
                    ].map((bar, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="text-[10px] text-gray-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          ₹{bar.val * 1500}
                        </div>
                        <div
                          style={{ height: `${bar.val}%` }}
                          className="w-full bg-gradient-to-t from-[#609f00] to-emerald-400 rounded-t-lg group-hover:brightness-110 transition-all"
                        />
                        <span className="text-[11px] font-bold text-gray-500">{bar.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Orders Distribution Graph */}
                <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
                  <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">
                    Order Status Analytics
                  </h3>
                  <div className="space-y-4 pt-1 text-xs">
                    <div>
                      <div className="flex justify-between font-bold text-gray-700 mb-1">
                        <span>Delivered Orders</span>
                        <span className="text-emerald-600">85%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[85%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold text-gray-700 mb-1">
                        <span>Processing Orders</span>
                        <span className="text-amber-600">10%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[10%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold text-gray-700 mb-1">
                        <span>Shipped / Transit</span>
                        <span className="text-sky-600">5%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full w-[5%]" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Recent Orders Preview */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-base font-extrabold text-gray-900">Recent Store Orders</h3>
                  <button
                    onClick={() => setActiveSection('orders')}
                    className="text-xs font-bold text-[#488710] hover:underline"
                  >
                    View All Orders →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-extrabold">
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                      {adminOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                            No store orders recorded yet.
                          </td>
                        </tr>
                      ) : (
                        adminOrders.slice(0, 5).map((ord) => (
                          <tr key={ord.id} className="hover:bg-gray-50/80">
                            <td className="py-3 px-3 text-[#488710] font-extrabold">{ord.id}</td>
                            <td className="py-3 px-3">{ord.shippingAddress.fullName}</td>
                            <td className="py-3 px-3 font-bold">₹{ord.totalAmount.toFixed(2)}</td>
                            <td className="py-3 px-3">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                {ord.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-gray-500">{ord.date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ================= SECTION 2: CUSTOMERS DIRECTORY ================= */}
          {activeSection === 'customers' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Registered Customers Directory</h3>
                  <p className="text-xs text-gray-500">Manage customer accounts, mobile numbers, and permissions.</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search customer..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-extrabold">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Username / Email</th>
                      <th className="py-3 px-4">Mobile Number</th>
                      <th className="py-3 px-4">Gender</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                    {filteredCustomers.map((usr) => (
                      <tr key={usr.id} className="hover:bg-gray-50/80">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{usr.name}</td>
                        <td className="py-3.5 px-4 text-gray-600">{usr.username}</td>
                        <td className="py-3.5 px-4 font-bold text-[#488710]">{usr.phone}</td>
                        <td className="py-3.5 px-4 text-gray-600">{usr.gender}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              usr.role === 'admin'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {usr.role || 'customer'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-gray-500">
                          {usr.status || 'Active'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SECTION 3: PRODUCTS DIRECTORY ================= */}
          {activeSection === 'products' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Store Products Directory ({storeProducts.length})</h3>
                  <p className="text-xs text-gray-500">Manage store items, pricing, discount tags, images, and homepage placements.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search product..."
                      className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  </div>

                  <button
                    onClick={handleOpenAddProd}
                    className="bg-[#609f00] hover:bg-[#528900] text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {storeProducts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
                  <Package className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs text-gray-500 font-medium">No products found in store catalog.</p>
                  <button
                    onClick={handleOpenAddProd}
                    className="bg-[#609f00] text-white text-xs font-extrabold px-4 py-2 rounded-xl"
                  >
                    Create First Product
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-extrabold">
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4">Homepage Sections</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                      {storeProducts
                        .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                        .map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50/80">
                            <td className="py-3.5 px-4 flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-gray-900 line-clamp-1">{product.name}</span>
                                {product.discountTag && (
                                  <span className="inline-block text-[9px] font-black bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                    {product.discountTag}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-gray-600 font-bold">{product.categoryName || product.category}</td>
                            <td className="py-3.5 px-4 font-bold">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[#488710] font-extrabold">₹{product.price}</span>
                                {product.originalPrice > product.price && (
                                  <span className="text-gray-400 line-through text-[11px]">₹{product.originalPrice}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  product.stock > 0
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {product.isFeatured && (
                                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                    ★ Featured
                                  </span>
                                )}
                                {product.isNewArrival && (
                                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                    ✦ New
                                  </span>
                                )}
                                {product.isBestSeller && (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                    🔥 Best-Seller
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditProduct(product)}
                                  className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= SECTION 4: ORDERS FULFILLMENT ================= */}
          {activeSection === 'orders' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Orders Fulfillment Manager</h3>
                  <p className="text-xs text-gray-500">Update order status and customer delivery states.</p>
                </div>

                <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200 overflow-x-auto w-full sm:w-auto">
                  {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        orderFilter === st ? 'bg-[#609f00] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-extrabold">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Payment & Order Info</th>
                      <th className="py-3 px-4 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                          No orders found in fulfillment manager.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/80">
                          <td className="py-3.5 px-4 font-extrabold text-[#488710]">{order.id}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-gray-900">{order.shippingAddress?.fullName || order.customerInfo?.name}</p>
                            <p className="text-[11px] text-gray-500">{order.shippingAddress?.phone || order.customerInfo?.phone}</p>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-gray-600 font-medium">{order.paymentMethod}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                order.status === 'Delivered'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : order.status === 'Processing'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : order.status === 'Shipped'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setSelectedOrderDetail(order)}
                              className="px-3 py-1.5 bg-[#f0f9e8] hover:bg-[#e4f4d6] text-[#488710] border border-[#d2ea9d] rounded-xl text-xs font-black transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Complete Details</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                              className="bg-gray-50 border border-gray-200 text-xs font-bold py-1.5 px-3 rounded-xl text-gray-800 focus:outline-none focus:border-[#609f00] cursor-pointer"
                            >
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SECTION 5: CATEGORIES ================= */}
          {activeSection === 'categories' && (
            <div className="space-y-6">
              
              {/* SECTION 5A: HOMEPAGE CATEGORY SECTION HEADINGS CONFIGURATION */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#609f00]" />
                    <span>Homepage Category Section Headings</span>
                  </h3>
                  <p className="text-xs text-gray-500">Customize the tagline badge heading and main title shown on the homepage.</p>
                </div>

                <form onSubmit={handleSaveHeadingsSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      Meta Tag / Badge Heading
                    </label>
                    <input
                      type="text"
                      required
                      value={editMetaTag}
                      onChange={(e) => setEditMetaTag(e.target.value)}
                      placeholder="e.g. EXPLORE DEPARTMENTS"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-bold text-[#488710]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      Main Section Title / Heading
                    </label>
                    <input
                      type="text"
                      required
                      value={editSectionTitle}
                      onChange={(e) => setEditSectionTitle(e.target.value)}
                      placeholder="e.g. Shop by Category"
                      className="w-full px-3.5 py-2 text-xs font-extrabold bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isSavingHeadings}
                      className="w-full bg-[#609f00] hover:bg-[#528900] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingHeadings ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Save Section Headings</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION 5B: CATEGORY DIRECTORY & MANAGER */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <Tags className="w-5 h-5 text-[#609f00]" />
                      <span>Store Categories Directory ({storeCategories.length})</span>
                    </h3>
                    <p className="text-xs text-gray-500">Add, edit, or remove product categories displayed across the store.</p>
                  </div>

                  <button
                    onClick={handleOpenAddCat}
                    className="bg-[#609f00] hover:bg-[#528900] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-2xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add New Category</span>
                  </button>
                </div>

                {storeCategories.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
                    <p className="text-xs text-gray-500 font-medium">No store categories found in database.</p>
                    <button
                      onClick={handleOpenAddCat}
                      className="bg-[#609f00] text-white text-xs font-extrabold px-4 py-2 rounded-xl"
                    >
                      Create First Category
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storeCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200 flex flex-col justify-between space-y-3 hover:border-gray-300 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-white shrink-0">
                            {cat.image ? (
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = heroImg;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">🏷️</div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-gray-900 text-sm">{cat.name}</h4>
                            <p className="text-[11px] text-gray-500 line-clamp-2">{cat.description || 'No description provided.'}</p>
                            <span className="inline-block text-[10px] font-extrabold text-[#488710] bg-[#f0f9e8] px-2 py-0.5 rounded-full border border-[#d2ea9d]">
                              Slug: {cat.slug}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-bold text-gray-400">
                            {cat.itemCount || 0} Products
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditCat(cat)}
                              className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCat(cat.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ================= SECTION 6: PAYMENTS ================= */}
          {activeSection === 'payments' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Razorpay Payment Transactions</h3>
                  <p className="text-xs text-gray-500">Real-time accurate record of Razorpay online payments & customer transaction details.</p>
                </div>
                <div className="flex items-center gap-2 bg-[#f0f9e8] text-[#488710] px-3.5 py-1.5 rounded-2xl border border-[#d2ea9d] text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Real-Time Razorpay Sync Active</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-extrabold">
                      <th className="py-3 px-4">Razorpay Payment ID</th>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Products Purchased</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Total Amount Paid</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                    {paymentsList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-gray-400 font-medium">
                          No payment transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      paymentsList.map((pay) => (
                        <tr key={pay.id} className="hover:bg-gray-50/80">
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{pay.razorpayPaymentId}</td>
                          <td className="py-3.5 px-4 text-[#488710] font-extrabold">{pay.orderId}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-gray-900">{pay.customer}</p>
                            <p className="text-[11px] text-gray-500">{pay.customerPhone} {pay.customerEmail ? `• ${pay.customerEmail}` : ''}</p>
                          </td>
                          <td className="py-3.5 px-4 text-gray-700 max-w-xs truncate">
                            {pay.fullOrder?.items?.map((it: any) => `${it.title} (x${it.quantity})`).join(', ') || 'Item'}
                          </td>
                          <td className="py-3.5 px-4 text-[#488710] font-extrabold">{pay.method}</td>
                          <td className="py-3.5 px-4 font-black text-gray-900 text-sm">{pay.amount}</td>
                          <td className="py-3.5 px-4 text-gray-600">
                            <p className="font-bold text-gray-900">{pay.date}</p>
                            <p className="text-[11px] text-gray-400">{pay.time}</p>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                pay.status === 'Successful'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : pay.status === 'COD'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {pay.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedOrderDetail(pay.fullOrder)}
                              className="px-3 py-1.5 bg-[#f0f9e8] hover:bg-[#e4f4d6] text-[#488710] border border-[#d2ea9d] rounded-xl text-xs font-black transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SECTION 7: STORE SETTINGS ================= */}
          {activeSection === 'settings' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-6 max-w-2xl">
              <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Store Settings & Configuration</h3>
                  <p className="text-xs text-gray-500">Configure parameters, maintenance switches, and store info.</p>
                </div>
                <button
                  onClick={() => setActiveSection('website-settings')}
                  className="bg-[#609f00] hover:bg-[#528900] text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>Website Settings</span>
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* WEBSITE SETTINGS LINK CARD */}
                <div
                  onClick={() => setActiveSection('website-settings')}
                  className="flex items-center justify-between p-4 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl border border-emerald-200 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#609f00] text-white flex items-center justify-center font-bold shadow-2xs">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900 group-hover:text-[#488710]">Website Settings</p>
                      <p className="text-gray-500 text-[11px]">Upload Navbar Logo, site branding, and storage configuration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#488710]">
                    <span>Configure</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div>
                    <p className="font-bold text-gray-900">OTP Mobile Verification</p>
                    <p className="text-gray-500 text-[11px]">Enforce OTP before user registration</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-3 py-1 rounded-full">
                    Enabled (Demo OTP: 1234)
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div>
                    <p className="font-bold text-gray-900">Backend System Server</p>
                    <p className="text-gray-500 text-[11px]">Node.js Express Server on Port 5000</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-3 py-1 rounded-full">
                    Online (Port 5000)
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div>
                    <p className="font-bold text-gray-900">Admin Authority Credentials</p>
                    <p className="text-gray-500 text-[11px]">chokku@store.com / chokku@123</p>
                  </div>
                  <span className="bg-purple-50 text-purple-700 border border-purple-200 font-bold px-3 py-1 rounded-full">
                    Protected
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 8: WEBSITE SETTINGS ================= */}
          {activeSection === 'website-settings' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-6 max-w-3xl">
              <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#609f00]" />
                    <span>Website Settings</span>
                  </h3>
                  <p className="text-xs text-gray-500">Manage site appearance, navbar branding, and storage configuration.</p>
                </div>
                <button
                  onClick={() => setActiveSection('settings')}
                  className="text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
                >
                  &larr; Back to Settings
                </button>
              </div>

              {/* NAVBAR LOGO UPLOAD BOX */}
              <div className="bg-gray-50/80 rounded-2xl border border-gray-200 p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#488710]" />
                      <span>Navbar Logo</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Upload custom header logo. Images are processed via <strong className="text-gray-700">Multer</strong> and saved to <strong className="text-gray-700">Supabase Storage / Bucket</strong>.
                    </p>
                  </div>
                  <span className="bg-[#eaf8dd] text-[#488710] border border-[#d2ea9d] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Multer & Storage
                  </span>
                </div>

                {/* CURRENT ACTIVE LOGO PREVIEW */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
                  <p className="text-xs font-bold text-gray-700">Current Navbar Preview:</p>
                  <div className="bg-white border border-gray-100 p-3 rounded-lg flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={navbarLogo || chokkuLogo}
                        alt="Current Navbar Logo"
                        className="h-12 max-w-[200px] object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = chokkuLogo;
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {navbarLogo ? 'Custom Uploaded Logo' : 'Default Asset Logo'}
                    </span>
                  </div>
                </div>

                {/* UPLOAD FORM */}
                <form onSubmit={handleLogoUploadSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700">Select New Logo Image File</label>
                    <div className="relative border-2 border-dashed border-gray-300 hover:border-[#609f00] rounded-2xl p-6 text-center transition-colors bg-white group cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-[#f0f9e8] text-[#488710] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-xs">
                          <span className="font-extrabold text-[#488710]">Click to choose file</span>
                          <span className="text-gray-500"> or drag & drop</span>
                        </div>
                        <p className="text-[10px] text-gray-400">PNG, JPG, SVG or WebP (Max 5MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* PREVIEW SELECTED FILE */}
                  {selectedLogoFile && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        {logoPreview && (
                          <img src={logoPreview} alt="Selected Logo Preview" className="w-12 h-12 object-contain rounded border border-gray-200 p-1" />
                        )}
                        <div>
                          <p className="font-bold text-gray-900 truncate max-w-[200px]">{selectedLogoFile.name}</p>
                          <p className="text-[10px] text-gray-500">{(selectedLogoFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLogoFile(null);
                          setLogoPreview(null);
                        }}
                        className="text-gray-400 hover:text-red-500 font-bold px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={!selectedLogoFile || isUploadingLogo}
                      className={`px-5 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-2 transition-all shadow-xs ${
                        !selectedLogoFile || isUploadingLogo
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-[#609f00] hover:bg-[#528900] cursor-pointer'
                      }`}
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading via Multer...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload Navbar Logo</span>
                        </>
                      )}
                    </button>

                    {navbarLogo && (
                      <button
                        type="button"
                        onClick={() => {
                          setNavbarLogo('');
                          addToast('Logo Reset', 'Reset navbar logo to default store asset', 'info');
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset to Default</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* STORAGE CONFIGURATION CARD */}
              <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200/80 p-5 space-y-3 text-xs">
                <h4 className="font-extrabold text-gray-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#488710]" />
                  <span>Bucket & Storage Configuration</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700 text-[11px]">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 font-mono">
                    <span className="text-gray-400 block font-sans text-[10px]">SUPABASE_PROJECT_ID</span>
                    <strong className="text-gray-900">gxavrslwnffdhhewyzil</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 font-mono">
                    <span className="text-gray-400 block font-sans text-[10px]">SUPABASE_REGION</span>
                    <strong className="text-gray-900">ap-southeast-1</strong>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= SECTION 9: HOMEPAGE SLIDER MANAGER ================= */}
          {activeSection === 'home-slider' && (
            <div className="space-y-6">
              
              {/* ================= 9A: LIST PAGE VIEW (DEFAULT) ================= */}
              {sliderViewMode === 'list' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-6">
                  {/* Top Bar with Add New Banner Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-[#609f00]" />
                        <span>Homepage Hero Banner & Slider Manager</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Manage all homepage hero banners, active/inactive states, and text content.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenAddBanner}
                      className="bg-[#609f00] hover:bg-[#528900] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Add New Banner</span>
                    </button>
                  </div>

                  {/* Banners List Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-extrabold">
                          <th className="py-3 px-4">Banner Image</th>
                          <th className="py-3 px-4">Meta Tag & Title</th>
                          <th className="py-3 px-4">Sub-Heading</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                        {activeSlides.map((slide) => {
                          const isInactive = slide.status === 'Inactive';
                          return (
                            <tr key={slide.id} className="hover:bg-gray-50/80 transition-colors">
                              {/* Asset Image Thumbnail */}
                              <td className="py-3.5 px-4 shrink-0">
                                <div className="w-28 h-16 rounded-xl overflow-hidden border border-gray-200 shadow-2xs relative bg-gray-100">
                                  <img
                                    src={slide.image || heroImg}
                                    alt={slide.heading}
                                    className={`w-full h-full object-cover ${isInactive ? 'grayscale opacity-60' : ''}`}
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = heroImg;
                                    }}
                                  />
                                </div>
                              </td>

                              {/* Meta Tag & Title */}
                              <td className="py-3.5 px-4 space-y-1">
                                <span className="inline-block bg-[#f0f9e8] text-[#488710] border border-[#d2ea9d] text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                                  {slide.metaTag || 'SPECIAL OFFER'}
                                </span>
                                <p className="font-extrabold text-gray-900 text-xs">{slide.heading}</p>
                              </td>

                              {/* Sub-Heading */}
                              <td className="py-3.5 px-4 max-w-xs text-gray-600 text-[11px] leading-relaxed truncate">
                                {slide.subheading}
                              </td>

                              {/* Status Badge & Quick Toggle */}
                              <td className="py-3.5 px-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSlideStatus(slide.id)}
                                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                                    isInactive
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                  title="Click to toggle Active/Inactive"
                                >
                                  {isInactive ? '● Inactive' : '● Active'}
                                </button>
                              </td>

                              {/* Action Buttons */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditSlide(slide)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlide(slide.id)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ================= 9B: BANNER CREATION & EDIT FORM VIEW ================= */}
              {sliderViewMode === 'form' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-6 max-w-4xl">
                  {/* Top Bar with Back Button */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#609f00]" />
                        <span>{slideEditId ? 'Edit Homepage Hero Banner' : 'Add New Homepage Hero Banner'}</span>
                      </h3>
                      <p className="text-xs text-gray-500">Configure asset image, meta tagline, title headings, and button link.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSliderViewMode('list')}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      &larr; Back to Banner List
                    </button>
                  </div>

                  {/* FORM */}
                  <form onSubmit={handleSaveSlideSubmit} className="space-y-6">
                    
                    {/* 1. IMAGE FILE UPLOAD INPUT */}
                    <div className="space-y-3 bg-gray-50/80 p-5 rounded-2xl border border-gray-200">
                      <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                        1. Upload Banner Image File
                      </label>
                      <p className="text-xs text-gray-500">Select an image file from your device to upload as the hero banner.</p>

                      {/* Dropzone Box */}
                      <div className="relative border-2 border-dashed border-gray-300 hover:border-[#609f00] rounded-2xl p-6 text-center transition-colors bg-white group cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSlideFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-12 h-12 rounded-full bg-[#f0f9e8] text-[#488710] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div className="text-xs">
                            <span className="font-extrabold text-[#488710]">Click to choose image file</span>
                            <span className="text-gray-500"> or drag & drop</span>
                          </div>
                          <p className="text-[10px] text-gray-400">PNG, JPG, WebP (1920 x 800 recommended)</p>
                        </div>
                      </div>
                      {slideFile && (
                        <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-extrabold flex items-center justify-between">
                          <span>Selected File: {slideFile.name} ({(slideFile.size / 1024).toFixed(1)} KB)</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSlideFile(null);
                              setSlidePreview(null);
                            }}
                            className="text-emerald-700 hover:text-rose-600 font-extrabold px-2 py-0.5"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 2. META TAG & HEADINGS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                          2. Meta Tag / Tagline Heading
                        </label>
                        <input
                          type="text"
                          required
                          value={slideMetaTag}
                          onChange={(e) => setSlideMetaTag(e.target.value)}
                          placeholder="e.g. SPECIAL SUMMER OFFER, 100% ORGANIC, EXCLUSIVE DEAL"
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-bold text-[#488710]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                          3. Active Status
                        </label>
                        <select
                          value={slideStatus}
                          onChange={(e) => setSlideStatus(e.target.value as 'Active' | 'Inactive')}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-bold text-gray-800 cursor-pointer"
                        >
                          <option value="Active">● Active (Show on Homepage)</option>
                          <option value="Inactive">● Inactive (Hide from Homepage)</option>
                        </select>
                      </div>
                    </div>

                    {/* 3. MAIN TITLE */}
                    <div className="text-xs">
                      <label className="block font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        4. Main Title / Heading
                      </label>
                      <input
                        type="text"
                        required
                        value={slideHeading}
                        onChange={(e) => setSlideHeading(e.target.value)}
                        placeholder="e.g. SHOP. PLAY. EARN REWARDS!"
                        className="w-full px-3.5 py-2.5 text-sm font-extrabold bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                      />
                    </div>

                    {/* 4. SUBHEADING */}
                    <div className="text-xs">
                      <label className="block font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        5. Sub-Heading / Description
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={slideSubheading}
                        onChange={(e) => setSlideSubheading(e.target.value)}
                        placeholder="e.g. Shop your favorites, play fun games and earn exciting rewards every day!"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                      />
                    </div>

                    {/* 5. BUTTON TEXT & LINK */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={slideButtonText}
                          onChange={(e) => setSlideButtonText(e.target.value)}
                          placeholder="e.g. Shop Now"
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                          Button Link
                        </label>
                        <input
                          type="text"
                          value={slideButtonLink}
                          onChange={(e) => setSlideButtonLink(e.target.value)}
                          placeholder="e.g. /shop"
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                        />
                      </div>
                    </div>

                    {/* FORM ACTION BUTTONS */}
                    <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isSavingSlider}
                        className="bg-[#609f00] hover:bg-[#528900] text-white px-6 py-3 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingSlider ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving Banner...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>{slideEditId ? 'Update Banner' : 'Save New Banner'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSliderViewMode('list')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel & Back to List
                      </button>
                    </div>

                  </form>
                </div>
              )}

            </div>
          )}

          {/* ================= SECTION: CATCH THE GIFT GAME SETTINGS ================= */}
          {activeSection === 'catch-the-gift-settings' && (
            <div className="space-y-6">
              {/* Page Header Banner */}
              <div className="bg-gradient-to-r from-[#386b0c] via-[#488710] to-[#0084d1] rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold text-amber-300 border border-white/30">
                    <Gamepad2 className="w-4 h-4" />
                    <span>GAME MANAGEMENT</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Catch the Gift Settings</h2>
                  <p className="text-xs sm:text-sm text-emerald-100 max-w-xl font-medium">
                    MongoDB Collection: <span className="font-bold font-mono text-amber-300">CatchGame</span>. Settings can be created once (Add button disabled after creation) and updated via Edit mode.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/catch-the-gift?testMode=true')}
                    className="bg-white hover:bg-emerald-50 text-[#386b0c] font-black px-4 py-2.5 rounded-xl text-xs shadow-md inline-flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Test Play Game</span>
                  </button>
                </div>
              </div>

              {/* Status Notice Card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                isConfigured
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <div>
                    <p className="text-xs font-black">
                      {isConfigured ? '✅ CatchGame Collection Configured in Database' : '⚠️ Initial Settings Not Created Yet'}
                    </p>
                    <p className="text-[11px] opacity-80">
                      {isConfigured
                        ? 'Settings exist in MongoDB. Add button is disabled; use Edit mode below to modify configuration.'
                        : 'Click "Add Game Settings" to create the initial document in CatchGame collection.'}
                    </p>
                  </div>
                </div>

                {isConfigured ? (
                  <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
                    Add Disabled (Configured)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateGameSettingsSubmit}
                    className="bg-[#488710] hover:bg-[#386b0c] text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer shrink-0"
                  >
                    + Add Game Settings
                  </button>
                )}
              </div>

              {/* Form Card Container */}
              <form onSubmit={handleSaveGameSettingsSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-8">
                
                {/* Section 1: Item Quantities & Rules */}
                <div className="space-y-6">
                  
                  {/* Game Duration */}
                  <div className="space-y-2 bg-purple-50/50 p-4 sm:p-5 rounded-2xl border border-purple-100 max-w-md">
                    <label className="text-xs font-black text-gray-800 flex items-center justify-between">
                      <span>⏱️ Game Duration (seconds)</span>
                      <span className="text-[10px] text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full font-bold">Timer</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={gameDurationVal}
                        onChange={(e) => setGameDurationVal(Math.max(5, parseInt(e.target.value) || 0))}
                        className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        required
                      />
                      <span className="text-xs font-bold text-purple-900 bg-purple-100 px-3 py-2.5 rounded-xl shrink-0">seconds</span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">Default duration: 25 seconds.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* 🎁 1. Gift Boxes */}
                    <div className="space-y-3 bg-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                      <div>
                        <label className="text-xs font-black text-gray-800 flex items-center justify-between border-b border-emerald-200/60 pb-2 mb-3">
                          <span className="flex items-center gap-1.5 text-sm">🎁 Gift Boxes</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Rewards</span>
                        </label>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-gray-700">Gift Box Count</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={gameGiftCount}
                            onChange={(e) => handleGiftCountChange(parseInt(e.target.value) || 1)}
                            className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#488710] focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium pt-2">Total gift boxes that appear during gameplay. Configure individual box rewards below.</p>
                    </div>

                    {/* 🪙 2. Coins */}
                    <div className="space-y-3 bg-amber-50/50 p-4 sm:p-5 rounded-2xl border border-amber-100 flex flex-col justify-between">
                      <div>
                        <label className="text-xs font-black text-gray-800 flex items-center justify-between border-b border-amber-200/60 pb-2 mb-3">
                          <span className="flex items-center gap-1.5 text-sm">🪙 Coins</span>
                          <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">Points</span>
                        </label>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">Coin Count</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={gameCoinCount}
                              onChange={(e) => setGameCoinCount(Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">Points per Coin</label>
                            <input
                              type="number"
                              min="1"
                              max="1000"
                              value={gamePointsPerCoin}
                              onChange={(e) => setGamePointsPerCoin(Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium pt-2">Customer gets +{gamePointsPerCoin} PTS for each coin collected.</p>
                    </div>

                    {/* 💣 3. Bombs */}
                    <div className="space-y-3 bg-rose-50/50 p-4 sm:p-5 rounded-2xl border border-rose-100 flex flex-col justify-between">
                      <div>
                        <label className="text-xs font-black text-gray-800 flex items-center justify-between border-b border-rose-200/60 pb-2 mb-3">
                          <span className="flex items-center gap-1.5 text-sm">💣 Bombs</span>
                          <span className="text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full font-bold">Deduction</span>
                        </label>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">Bomb Count</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={gameBombCount}
                              onChange={(e) => setGameBombCount(Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">Points Loss per Bomb</label>
                            <input
                              type="number"
                              min="0"
                              max="1000"
                              value={gamePointsLossPerBomb}
                              onChange={(e) => setGamePointsLossPerBomb(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium pt-2">Customer loses -{gamePointsLossPerBomb} PTS for each bomb hit.</p>
                    </div>

                  </div>
                </div>

                {/* Section 2: Falling Speeds Control */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-extrabold text-gray-900">Item Falling Speeds Control</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    
                    {/* 1. Gift Box Speed */}
                    <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-gray-800">🎁 Gift Box Speed</label>
                        <span className="text-xs font-black text-[#488710] bg-emerald-100 px-2.5 py-0.5 rounded-full">{gameGiftSpeed}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.1"
                        value={gameGiftSpeed}
                        onChange={(e) => setGameGiftSpeed(parseFloat(e.target.value))}
                        className="w-full accent-[#488710] cursor-pointer"
                      />
                      <p className="text-[11px] text-gray-500 font-medium">Control how fast gift boxes fall.</p>
                    </div>

                    {/* 2. Coin Speed */}
                    <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-gray-800">🪙 Coin Speed</label>
                        <span className="text-xs font-black text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full">{gameCoinSpeed}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.1"
                        value={gameCoinSpeed}
                        onChange={(e) => setGameCoinSpeed(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <p className="text-[11px] text-gray-500 font-medium">Control how fast coins fall.</p>
                    </div>

                    {/* 3. Bomb Speed */}
                    <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-gray-800">💣 Bomb Speed</label>
                        <span className="text-xs font-black text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full">{gameBombSpeed}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.1"
                        value={gameBombSpeed}
                        onChange={(e) => setGameBombSpeed(parseFloat(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                      <p className="text-[11px] text-gray-500 font-medium">Control bomb falling speed separately.</p>
                    </div>

                  </div>
                </div>

                {/* Section 3: PER-BOX REWARD CONFIGURATION (Coins or Product Offers) */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <h3 className="text-base font-extrabold text-gray-900">Individual Gift Box Reward Configurations</h3>
                    </div>
                    <span className="text-xs font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-200">
                      {gameGiftBoxes.length} Boxes Configured
                    </span>
                  </div>

                  <div className="space-y-4">
                    {gameGiftBoxes.map((box, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50/90 rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-[#488710] text-white flex items-center justify-center font-black text-xs">
                              #{box.boxNumber || idx + 1}
                            </div>
                            <h4 className="text-sm font-black text-gray-900">Gift Box {box.boxNumber || idx + 1}</h4>
                          </div>

                          {/* Reward Type Selection */}
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-600">Reward Type:</label>
                            <select
                              value={box.rewardType}
                              onChange={(e) => handleBoxRewardTypeChange(idx, e.target.value as 'coins' | 'product_offer')}
                              className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-black text-gray-800 focus:outline-none focus:border-[#488710] cursor-pointer"
                            >
                              <option value="coins">🪙 Coins</option>
                              <option value="product_offer">🎁 Product Offer</option>
                            </select>
                          </div>
                        </div>

                        {/* Reward Config Details */}
                        {box.rewardType === 'coins' ? (
                          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-2">
                            <label className="block text-xs font-extrabold text-gray-800">
                              Coins Reward Amount
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="100"
                                step="100"
                                value={box.coinAmount || 1000}
                                onChange={(e) => handleBoxFieldChange(idx, 'coinAmount', parseInt(e.target.value) || 0)}
                                className="w-full sm:w-64 bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500"
                                placeholder="e.g. 1000, 5000"
                              />
                              <span className="text-xs font-black text-amber-700 bg-amber-100 px-3 py-2 rounded-xl">
                                Coins
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium">
                              Customer opening this box will get {box.coinAmount?.toLocaleString() || 1000} coins credited directly to their points balance.
                            </p>
                          </div>
                        ) : (
                          /* PRODUCT OFFER REWARD CONFIGURATION */
                          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Product Selection */}
                              <div>
                                <label className="block text-xs font-extrabold text-gray-800 mb-1">
                                  Select Target Product
                                </label>
                                <select
                                  value={box.productId || ''}
                                  onChange={(e) => handleBoxProductSelect(idx, e.target.value)}
                                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#488710] cursor-pointer"
                                >
                                  <option value="">-- Choose Product from Catalog --</option>
                                  {productList.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} (₹{p.price})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Offer Percentage */}
                              <div>
                                <label className="block text-xs font-extrabold text-gray-800 mb-1">
                                  Offer Percentage (% OFF)
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="5"
                                    max="95"
                                    value={box.offerPercentage || 50}
                                    onChange={(e) => handleBoxFieldChange(idx, 'offerPercentage', parseInt(e.target.value) || 0)}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#488710]"
                                    placeholder="e.g. 50"
                                  />
                                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-2 rounded-xl">
                                    % OFF
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Product Detail Preview Row */}
                            <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-3">
                                {box.productImage ? (
                                  <img src={box.productImage} alt="Product" className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-gray-50" />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-lg">🛍️</div>
                                )}
                                <div>
                                  <p className="font-extrabold text-gray-900">{box.productName || 'No Product Selected'}</p>
                                  <p className="text-[11px] text-gray-500">
                                    Original Price: <span className="line-through">₹{box.originalPrice || 0}</span> | Offer Price: <span className="font-bold text-[#488710]">₹{box.offerPrice || 0}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                                  {box.offerPercentage || 0}% OFF
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buttons Action Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                  {/* REQUIREMENT 1: Add Button Disabled after creation */}
                  <button
                    type="button"
                    disabled={isConfigured}
                    onClick={handleCreateGameSettingsSubmit}
                    className={`font-extrabold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 ${
                      isConfigured
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-[#488710] hover:bg-[#386b0c] text-white shadow-md cursor-pointer'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Game Settings {isConfigured ? '(Disabled)' : ''}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetGameSettings}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold px-5 py-3 rounded-2xl text-xs transition-all cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reset Defaults</span>
                    </button>

                    <button
                      type="submit"
                      className="bg-[#386b0c] hover:bg-[#2c5309] text-white font-extrabold px-8 py-3 rounded-2xl text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 hover:scale-105"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit & Save Settings</span>
                    </button>
                  </div>
                </div>

              </form>
            </div>
          )}

          {/* ================= SECTION: CATCH THE GIFT CUSTOMER SCORES ================= */}
          {activeSection === 'catch-the-gift-scores' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-[#386b0c] rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold text-amber-300 border border-white/30">
                    <Trophy className="w-4 h-4" />
                    <span>CUSTOMER RESULTS</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Customer Game Scores</h2>
                  <p className="text-xs sm:text-sm text-purple-100 font-medium max-w-xl">
                    View verified gameplay records submitted by authenticated customers.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
                  <p className="text-[10px] uppercase font-extrabold tracking-wider opacity-80">Total Plays</p>
                  <p className="text-2xl font-black text-amber-300 leading-none">{customerScoresList.length}</p>
                </div>
              </div>

              {/* Customer Scores Table */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4">Customer Name</th>
                        <th className="py-3.5 px-4">Mobile / Email</th>
                        <th className="py-3.5 px-4 text-center">Score (PTS)</th>
                        <th className="py-3.5 px-4 text-center">Gifts (🎁)</th>
                        <th className="py-3.5 px-4 text-center">Coins (🪙)</th>
                        <th className="py-3.5 px-4 text-center">Special (💎)</th>
                        <th className="py-3.5 px-4 text-center">Bombs (💣)</th>
                        <th className="py-3.5 px-4 text-right">Played Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold text-gray-800">
                      {customerScoresList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-gray-400 font-medium">
                            <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-bold text-gray-700">No Customer Game Scores Recorded</p>
                            <p className="text-xs text-gray-400 mt-1">When authenticated customers play Catch the Gift, their scores will appear here.</p>
                          </td>
                        </tr>
                      ) : (
                        customerScoresList.map((sc, idx) => (
                          <tr key={sc.id || idx} className="hover:bg-emerald-50/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#488710] text-white font-extrabold text-xs flex items-center justify-center">
                                  {sc.name ? sc.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <p className="font-extrabold text-gray-900 leading-tight">{sc.name || 'Customer'}</p>
                                  <p className="text-[10px] text-gray-400 font-medium">@{sc.username || 'user'}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <p className="text-xs font-mono font-bold text-gray-800">{sc.phone}</p>
                              <p className="text-[10px] text-gray-400">{sc.email !== 'N/A' ? sc.email : ''}</p>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-block bg-amber-100 text-amber-800 font-black text-sm px-3 py-1 rounded-full border border-amber-200">
                                {sc.score} PTS
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center font-black text-emerald-700">
                              {sc.giftsCollected || 0}
                            </td>

                            <td className="py-3.5 px-4 text-center font-black text-amber-600">
                              {sc.coinsCollected || 0}
                            </td>

                            <td className="py-3.5 px-4 text-center font-black text-sky-600">
                              {sc.specialGiftsCollected || 0}
                            </td>

                            <td className="py-3.5 px-4 text-center font-black text-rose-600">
                              {sc.bombsHit || 0}
                            </td>

                            <td className="py-3.5 px-4 text-right text-gray-500 font-medium text-[11px]">
                              {sc.playedAt ? new Date(sc.playedAt).toLocaleString() : 'Recently'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


        </main>

      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 sticky top-0 bg-white z-10">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#609f00]" />
                <span>{prodEditId ? 'Edit Store Product' : 'Add New Product to Store Catalog'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4">
              {/* 1. BASIC DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Wireless Noise-Canceling Headphones"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-extrabold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-bold text-gray-800 cursor-pointer"
                  >
                    {storeCategories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                    {storeCategories.length === 0 && (
                      <option value="general">General</option>
                    )}
                  </select>
                </div>
              </div>

              {/* 2. PRICING & STOCK */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodOriginalPrice}
                    onChange={(e) => setProdOriginalPrice(e.target.value)}
                    placeholder="99.99"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Discount Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodSellingPrice}
                    onChange={(e) => setProdSellingPrice(e.target.value)}
                    placeholder="79.99"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-extrabold text-[#488710]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Discount Tag
                  </label>
                  <input
                    type="text"
                    value={prodDiscountTag}
                    onChange={(e) => setProdDiscountTag(e.target.value)}
                    placeholder="e.g. SAVE 20%"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-bold text-amber-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    In Stock Count *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    placeholder="10"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-bold"
                  />
                </div>
              </div>

              {/* 3. PRODUCT IMAGES (1 TO 7 IMAGES) UPLOAD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-gray-700 uppercase tracking-wider">
                    Product Gallery Images (Upload 1 to 7 Images)
                  </label>
                  <span className="text-[10px] font-bold text-[#488710]">
                    {prodPreviews.length} / 7 Images Chosen
                  </span>
                </div>

                <div className="relative border-2 border-dashed border-gray-300 hover:border-[#609f00] rounded-2xl p-4 text-center transition-colors bg-white group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleProductFilesSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-[#f0f9e8] text-[#488710] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-extrabold text-[#488710]">Click to choose product images (Select up to 7 files)</span>
                      <span className="text-gray-500"> or drag & drop</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Select 1 to 7 image files (PNG, JPG, WebP)</p>
                  </div>
                </div>

                {/* Thumbnail Previews Gallery */}
                {prodPreviews.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Selected Gallery Previews (First image is main cover):</p>
                    <div className="grid grid-cols-7 gap-2">
                      {prodPreviews.map((url, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square group bg-gray-50">
                          <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[8px] font-bold px-1 rounded">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. DESCRIPTION */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Detailed product features, materials, craftsmanship, and benefits..."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                />
              </div>

              {/* 5. TECHNICAL SPECIFICATIONS (KEY-VALUE PAIRS) */}
              <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-gray-800 text-xs uppercase tracking-wider">
                    Technical Specifications
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="text-[11px] font-extrabold text-[#488710] hover:text-[#37680c] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Spec Row</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {prodSpecs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Key (e.g. Warranty)"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                        className="w-1/3 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#609f00] font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 1 Year Official Warranty)"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#609f00]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 font-bold text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. HOMEPAGE PLACEMENT FLAGS */}
              <div className="bg-[#f0f9e8] p-3.5 rounded-2xl border border-[#d2ea9d] space-y-2">
                <label className="block font-extrabold text-[#488710] text-xs uppercase tracking-wider">
                  Homepage Placement Sections
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-gray-800">
                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xl border border-emerald-100 hover:border-[#609f00]">
                    <input
                      type="checkbox"
                      checked={prodIsFeatured}
                      onChange={(e) => setProdIsFeatured(e.target.checked)}
                      className="w-4 h-4 accent-[#609f00] rounded cursor-pointer"
                    />
                    <span>★ Featured Products</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xl border border-emerald-100 hover:border-[#609f00]">
                    <input
                      type="checkbox"
                      checked={prodIsNewArrival}
                      onChange={(e) => setProdIsNewArrival(e.target.checked)}
                      className="w-4 h-4 accent-[#609f00] rounded cursor-pointer"
                    />
                    <span>✦ New Arrivals</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xl border border-emerald-100 hover:border-[#609f00]">
                    <input
                      type="checkbox"
                      checked={prodIsBestSeller}
                      onChange={(e) => setProdIsBestSeller(e.target.checked)}
                      className="w-4 h-4 accent-[#609f00] rounded cursor-pointer"
                    />
                    <span>🔥 Best-Selling Products</span>
                  </label>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProd}
                  className="bg-[#609f00] hover:bg-[#528900] text-white px-5 py-2.5 rounded-xl font-extrabold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProd ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Product...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{prodEditId ? 'Update Product' : 'Save Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#609f00]" />
                <span>{catEditId ? 'Edit Store Category' : 'Create New Store Category'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCatSubmit} className="space-y-4">
              {/* Category Image Upload Dropzone */}
              <div className="space-y-2">
                <label className="block font-bold text-gray-700 uppercase tracking-wider">
                  Category Image Banner
                </label>
                <div className="relative border-2 border-dashed border-gray-300 hover:border-[#609f00] rounded-2xl p-4 text-center transition-colors bg-white group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCatFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-[#f0f9e8] text-[#488710] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-extrabold text-[#488710]">Click to choose category image file</span>
                      <span className="text-gray-500"> or drag & drop</span>
                    </div>
                    <p className="text-[10px] text-gray-400">PNG, JPG, WebP</p>
                  </div>
                </div>

                {/* Preview Thumbnail if selected or existing */}
                {(catPreview || catFile) && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-200">
                    {catPreview && (
                      <img src={catPreview} alt="Category Preview" className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
                    )}
                    <div className="text-xs">
                      <p className="font-bold text-gray-800">{catFile ? catFile.name : 'Current Category Image'}</p>
                      {catFile && <p className="text-[10px] text-gray-500">{(catFile.size / 1024).toFixed(1)} KB</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Category Name Input */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Electronics, Fashion, Fresh Groceries"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-extrabold text-gray-900"
                />
              </div>

              {/* Category Description */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="e.g. Latest smart devices, audio gear, and essential tech accessories."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={catStatus}
                  onChange={(e) => setCatStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-bold text-gray-800"
                >
                  <option value="Active">● Active (Show on Store)</option>
                  <option value="Inactive">● Inactive (Hide from Store)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCat}
                  className="bg-[#609f00] hover:bg-[#528900] text-white px-5 py-2.5 rounded-xl font-extrabold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingCat ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{catEditId ? 'Update Category' : 'Save Category'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ORDER & PAYMENTS COMPLETE DETAILS MODAL ================= */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Order & Razorpay Payment Record</span>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <span>Order {selectedOrderDetail.id}</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-extrabold border ${
                    selectedOrderDetail.paymentStatus === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : selectedOrderDetail.paymentMethod?.includes('Cash')
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedOrderDetail.paymentStatus === 'paid' ? 'SUCCESSFUL (PAID)' : selectedOrderDetail.paymentMethod?.includes('Cash') ? 'CASH ON DELIVERY' : 'PENDING'}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid 1: Customer Details & Delivery Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Customer Details Box */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-2">
                <h4 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-[#488710]">
                  <Users className="w-4 h-4" /> Customer Details
                </h4>
                <div className="space-y-1 text-gray-700 font-medium">
                  <p><span className="text-gray-400 font-bold">Name:</span> <strong className="text-gray-900">{selectedOrderDetail.shippingAddress?.fullName || selectedOrderDetail.customerInfo?.name || 'N/A'}</strong></p>
                  <p><span className="text-gray-400 font-bold">Phone:</span> {selectedOrderDetail.shippingAddress?.phone || selectedOrderDetail.customerInfo?.phone || 'N/A'}</p>
                  <p><span className="text-gray-400 font-bold">Email:</span> {selectedOrderDetail.shippingAddress?.email || selectedOrderDetail.customerInfo?.email || 'N/A'}</p>
                  {selectedOrderDetail.customerInfo?.username && (
                    <p><span className="text-gray-400 font-bold">Username:</span> @{selectedOrderDetail.customerInfo.username}</p>
                  )}
                </div>
              </div>

              {/* Delivery Address Box */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-2">
                <h4 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-[#488710]">
                  <MapPin className="w-4 h-4" /> Delivery Address
                </h4>
                <div className="space-y-1 text-gray-700 font-medium">
                  <p className="font-bold text-gray-900">{selectedOrderDetail.shippingAddress?.fullName}</p>
                  <p>{selectedOrderDetail.shippingAddress?.address}</p>
                  <p>{[selectedOrderDetail.shippingAddress?.city, selectedOrderDetail.shippingAddress?.state].filter(Boolean).join(', ')} - <strong>{selectedOrderDetail.shippingAddress?.pincode}</strong></p>
                  <p className="text-gray-500">Contact: {selectedOrderDetail.shippingAddress?.phone}</p>
                </div>
              </div>
            </div>

            {/* Product Purchased Table */}
            <div className="space-y-2">
              <h4 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-[#488710]">
                <ShoppingBag className="w-4 h-4" /> Purchased Products ({selectedOrderDetail.items?.length || 0})
              </h4>
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 text-gray-400 font-extrabold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Category/Weight</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {selectedOrderDetail.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 flex items-center gap-2 font-bold text-gray-900">
                          {(item.image || item.product?.image) && (
                            <img src={item.image || item.product?.image} alt={item.title || item.product?.name} className="w-8 h-8 object-cover rounded-lg border border-gray-200 shrink-0" />
                          )}
                          <span>{item.title || item.product?.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500">{item.weight || item.product?.weight || item.category || 'Standard'}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">₹{(item.price || item.product?.price || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-gray-900">₹{((item.price || item.product?.price || 0) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Razorpay Transaction Details & Audit Trail */}
            <div className="bg-[#f0f9e8]/60 border border-[#d2ea9d] p-4 rounded-2xl space-y-3">
              <h4 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-[#488710]">
                <CreditCard className="w-4 h-4" /> Razorpay Transaction Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-[11px] text-gray-500 font-bold">Razorpay Payment ID</p>
                  <p className="font-mono font-bold text-gray-900">{selectedOrderDetail.razorpayPaymentId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-bold">Razorpay Order ID</p>
                  <p className="font-mono font-bold text-gray-900">{selectedOrderDetail.razorpayOrderId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-bold">Payment Method Used</p>
                  <p className="font-bold text-[#488710]">{selectedOrderDetail.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-bold">Payment Status</p>
                  <p className="font-bold text-gray-900 uppercase">{selectedOrderDetail.paymentStatus || 'paid'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-bold">Payment Date</p>
                  <p className="font-bold text-gray-900">{selectedOrderDetail.paymentDate || selectedOrderDetail.date}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-bold">Payment Time</p>
                  <p className="font-bold text-gray-900">{selectedOrderDetail.paymentTime || 'N/A'}</p>
                </div>
              </div>

              {/* Amount Calculation Row */}
              <div className="pt-3 border-t border-[#d2ea9d] flex items-center justify-between font-extrabold text-sm text-gray-900">
                <span>Total Amount Paid via Gateway:</span>
                <span className="text-base text-[#488710] font-black">₹{selectedOrderDetail.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="px-5 py-2.5 bg-[#488710] hover:bg-[#386b0c] text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
