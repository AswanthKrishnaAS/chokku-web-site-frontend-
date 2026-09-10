import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Order } from '../types';
import { useToast } from './ToastContext';
import { socket } from '../socket';

interface RegisterData {
  name: string;
  phone: string;
  gender: string;
  username: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  customerUser: User | null;
  adminUser: User | null;
  customerPoints: number;
  fetchCustomerPoints: () => Promise<number>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password?: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<boolean>;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  logout: () => void;
  adminLogout: () => void;
  updateProfile: (updated: Partial<User>) => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

const getCustomerOrdersKey = (user: User | null): string => {
  if (!user) return 'chokku_orders_guest';
  const id = user.id || user.username || user.phone || 'customer';
  return `chokku_orders_user_${id}`;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CUSTOMER_USER_KEY = 'chokku_customer_user_v2';
const CUSTOMER_TOKEN_KEY = 'chokku_customer_token_v2';
const ADMIN_USER_KEY = 'chokku_admin_user_v2';
const ADMIN_TOKEN_KEY = 'chokku_admin_token_v2';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  // Customer Session State (Main Website)
  const [customerUser, setCustomerUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_USER_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed && parsed.role !== 'admin' ? parsed : null;
    } catch {
      return null;
    }
  });

  // Admin Session State (Admin Portal)
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_USER_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed && parsed.role === 'admin' ? parsed : null;
    } catch {
      return null;
    }
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [customerPoints, setCustomerPoints] = useState<number>(0);

  // Fetch Total Customer Points from Backend API
  const fetchCustomerPoints = async (): Promise<number> => {
    if (!customerUser) {
      setCustomerPoints(0);
      return 0;
    }
    try {
      const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
      const userId = customerUser.id || (customerUser as any)._id || '';

      const res = await fetch(`${API_URL}/catch-game/my-points`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.totalPoints === 'number') {
          setCustomerPoints(data.totalPoints);
          return data.totalPoints;
        }
      }
    } catch (err) {
      console.warn('Failed fetching customer points from backend:', err);
    }
    return 0;
  };

  // Sync customer points automatically whenever customerUser logs in or changes
  useEffect(() => {
    if (customerUser) {
      fetchCustomerPoints();
    } else {
      setCustomerPoints(0);
    }
  }, [customerUser]);

  // Clean legacy shared storage keys once
  useEffect(() => {
    try {
      localStorage.removeItem('chokku_orders_v1');
      localStorage.removeItem('chokku_user_v1');
      localStorage.removeItem('chokku_token');
    } catch (e) {
      console.error('Failed clearing legacy storage keys', e);
    }
  }, []);

  // Sync Orders for Current Logged-In Customer
  useEffect(() => {
    if (!customerUser) {
      setOrders([]);
      return;
    }
    try {
      const userKey = getCustomerOrdersKey(customerUser);
      const saved = localStorage.getItem(userKey);
      setOrders(saved ? JSON.parse(saved) : []);
    } catch {
      setOrders([]);
    }
  }, [customerUser]);

  // Persist Customer User
  useEffect(() => {
    try {
      if (customerUser) {
        localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(customerUser));
      } else {
        localStorage.removeItem(CUSTOMER_USER_KEY);
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to update customer storage', e);
    }
  }, [customerUser]);

  // Persist Admin User
  useEffect(() => {
    try {
      if (adminUser) {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
      } else {
        localStorage.removeItem(ADMIN_USER_KEY);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to update admin storage', e);
    }
  }, [adminUser]);

  const sendOtp = async (phone: string): Promise<{ success: boolean; message: string; otp?: string }> => {
    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        addToast('OTP Request Failed', data.message || 'Unable to send OTP', 'error');
        return { success: false, message: data.message || 'Unable to send OTP' };
      }

      addToast('OTP Sent', `Verification code sent to ${phone}. (Demo OTP: ${data.otp || '1234'})`, 'info');
      return { success: true, message: data.message, otp: data.otp };
    } catch (error) {
      console.error('Send OTP error:', error);
      addToast('Demo Mode', `OTP sent to ${phone}. Use code: 1234`, 'info');
      return { success: true, message: 'OTP sent successfully (Demo Mode)', otp: '1234' };
    }
  };

  const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        addToast('Invalid OTP', data.message || 'OTP verification failed', 'error');
        return false;
      }

      addToast('Mobile Verified!', 'OTP verification successful.', 'success');
      return true;
    } catch (error) {
      console.error('Verify OTP error:', error);
      if (otp.trim() === '1234') {
        addToast('Mobile Verified!', 'OTP verification successful (Demo Mode).', 'success');
        return true;
      }
      addToast('Verification Failed', 'Incorrect OTP code. Enter 1234 for demo.', 'error');
      return false;
    }
  };

  // Customer Login
  const login = async (username: string, password?: string): Promise<boolean> => {
    if (username.trim().toLowerCase() === 'chokku@store.com') {
      addToast('Access Denied', 'Admin credentials cannot log in through Customer login. Please use Admin login page.', 'error');
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        addToast('Login Failed', data.message || 'Invalid username or password', 'error');
        return false;
      }

      if (data.token) {
        localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
      }
      if (data.user) {
        setCustomerUser(data.user);
      }

      addToast('Welcome Back!', `Logged in successfully as ${data.user?.name || username}`, 'success');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      if (username && password) {
        if (username.trim().toLowerCase() === 'chokku@store.com') {
          addToast('Access Denied', 'Admin credentials cannot log in through Customer login. Please use Admin login page.', 'error');
          return false;
        }
        const demoUser: User = {
          id: 'u-' + Date.now(),
          name: username,
          username: username,
          email: username.includes('@') ? username : `${username}@chokku.store`,
          phone: '+91 9876543210',
          gender: 'Male',
          role: 'customer',
        };
        setCustomerUser(demoUser);
        addToast('Welcome Back!', `Logged in as ${username}`, 'success');
        return true;
      }
      addToast('Connection Error', 'Could not connect to the backend server.', 'error');
      return false;
    }
  };

  // Admin Login
  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_URL}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.message || 'Invalid email or password.';
        addToast('Admin Login Failed', errorMsg, 'error');
        return { success: false, message: errorMsg };
      }

      if (data.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      }
      if (data.user) {
        setAdminUser(data.user);
      }

      addToast('Admin Authenticated!', `Welcome to Admin Panel, ${data.user?.name || 'Admin'}`, 'success');
      return { success: true, message: 'Admin login successful' };
    } catch (error) {
      console.error('Admin login API error:', error);
      if (email === 'chokku@store.com' && password === 'chokku@123') {
        const admin: User = {
          id: 'admin-101',
          name: 'Chokku Admin',
          username: 'chokku@store.com',
          email: 'chokku@store.com',
          phone: '+91 9999999999',
          gender: 'Male',
          role: 'admin',
        };
        setAdminUser(admin);
        addToast('Admin Authenticated!', 'Welcome to Admin Panel (Offline Mode)', 'success');
        return { success: true, message: 'Admin login successful' };
      }
      const errorMsg = 'Invalid email or password. Customer accounts cannot access Admin login.';
      addToast('Admin Login Failed', errorMsg, 'error');
      return { success: false, message: errorMsg };
    }
  };

  const saveCustomerToStorage = (customerObj: any) => {
    try {
      const saved = localStorage.getItem('chokku_all_customers');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.some((c: any) => (c.phone && c.phone === customerObj.phone) || (c.id && c.id === customerObj.id))) {
        localStorage.setItem('chokku_all_customers', JSON.stringify([customerObj, ...list]));
      }
      socket.emit('new_customer', customerObj);
    } catch (e) {
      console.error('Failed saving customer to localStorage', e);
    }
  };

  // Customer Register
  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        addToast('Registration Failed', resData.message || 'Could not register user', 'error');
        return false;
      }

      if (resData.token) {
        localStorage.setItem(CUSTOMER_TOKEN_KEY, resData.token);
      }
      if (resData.user) {
        setCustomerUser(resData.user);
        saveCustomerToStorage({
          id: resData.user.id || 'u-' + Date.now(),
          name: resData.user.name || data.name,
          username: resData.user.username || data.username,
          email: resData.user.email || `${data.username}@chokku.store`,
          phone: data.phone,
          gender: data.gender,
          role: 'customer',
          date: new Date().toISOString().split('T')[0],
          status: 'Active',
        });
      }

      addToast('Account Created!', `Welcome to Chokku Store, ${resData.user?.name || data.name}!`, 'success');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      const newUser: User = {
        id: 'u-' + Date.now(),
        name: data.name,
        username: data.username,
        gender: data.gender,
        phone: data.phone,
        role: 'customer',
      };
      setCustomerUser(newUser);
      saveCustomerToStorage({
        ...newUser,
        email: `${data.username}@chokku.store`,
        date: new Date().toISOString().split('T')[0],
        status: 'Active',
      });
      addToast('Account Created!', `Welcome, ${data.name}! Registered successfully.`, 'success');
      return true;
    }
  };

  // Customer Logout (Affects main store only)
  const logout = () => {
    setCustomerUser(null);
    localStorage.removeItem(CUSTOMER_USER_KEY);
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    addToast('Logged Out', 'You have been signed out from customer account.', 'info');
  };

  // Admin Logout (Affects Admin Portal only)
  const adminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    addToast('Admin Signed Out', 'You have been signed out from Admin Panel.', 'info');
  };

  const updateProfile = (updated: Partial<User>) => {
    if (!customerUser) return;
    const newProfile = { ...customerUser, ...updated };
    setCustomerUser(newProfile);
    addToast('Profile Updated', 'Your personal account info has been saved.', 'success');
  };

  const addOrder = (order: Order) => {
    setOrders((prev) => {
      const updated = [order, ...prev];
      try {
        const key = getCustomerOrdersKey(customerUser);
        localStorage.setItem(key, JSON.stringify(updated));

        // Save to master orders list for Admin Portal
        const masterSaved = localStorage.getItem('chokku_all_orders');
        const masterList: Order[] = masterSaved ? JSON.parse(masterSaved) : [];
        if (!masterList.some((o: Order) => o.id === order.id)) {
          localStorage.setItem('chokku_all_orders', JSON.stringify([order, ...masterList]));
        }

        // Emit real-time WebSocket event for instant Admin Dashboard notification
        socket.emit('new_order', order);
      } catch (e) {
        console.error('Failed to save order to localStorage', e);
      }
      return updated;
    });
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    // 1. Update active customer context state if order is present
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      // 2. Update master admin orders list in localStorage
      const masterSaved = localStorage.getItem('chokku_all_orders');
      if (masterSaved) {
        const masterList: Order[] = JSON.parse(masterSaved);
        const updatedMaster = masterList.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        );
        localStorage.setItem('chokku_all_orders', JSON.stringify(updatedMaster));
      }

      // 3. Scan all customer order keys in localStorage and update customer order status
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chokku_orders_')) {
          const itemVal = localStorage.getItem(key);
          if (itemVal) {
            try {
              const parsed: Order[] = JSON.parse(itemVal);
              if (Array.isArray(parsed) && parsed.some((o) => o.id === orderId)) {
                const updatedCustomerOrders = parsed.map((o) =>
                  o.id === orderId ? { ...o, status: newStatus } : o
                );
                localStorage.setItem(key, JSON.stringify(updatedCustomerOrders));
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      // Emit real-time order status update socket event
      socket.emit('order_status_update', { orderId, status: newStatus });
    } catch (e) {
      console.error('Failed to update order status in storage:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: customerUser, // Main store pages inspect customerUser ONLY
        customerUser,
        adminUser,
        customerPoints,
        fetchCustomerPoints,
        isAuthenticated: Boolean(customerUser),
        isAdmin: Boolean(adminUser && adminUser.role === 'admin'),
        login,
        adminLogin,
        register,
        sendOtp,
        verifyOtp,
        logout,
        adminLogout,
        updateProfile,
        orders,
        addOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
