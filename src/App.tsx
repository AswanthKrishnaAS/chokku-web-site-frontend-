import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';
import { WebsiteSettingsProvider } from './context/WebsiteSettingsContext';
import { CategoryProvider } from './context/CategoryContext';
import { ProductProvider } from './context/ProductContext';

import { GameSettingsProvider } from './context/GameSettingsContext';

import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';

import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';

import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { CategoryPage } from './pages/CategoryPage';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { Points } from './pages/Points';
import { Addresses } from './pages/Addresses';
import { Orders } from './pages/Orders';
import { PlayAndWin } from './pages/PlayAndWin';
import { CatchtheGift } from './pages/CatchtheGift';
import { NotFound } from './pages/NotFound';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';

// Scroll To Top on route transition
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Main App Layout with conditional Navbar and Footer rendering
const AppLayout: React.FC = () => {
  const { pathname } = useLocation();
  
  // Hide Navbar & Footer on Admin Login page and Admin Dashboard
  const hideHeaderFooter = ['/admin-login', '/admin-dashboard'].includes(pathname);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans antialiased pb-16 lg:pb-0">
      {!hideHeaderFooter && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/points" element={<Points />} />
          <Route path="/addresses" element={<Addresses />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/play-and-win" element={<PlayAndWin />} />
          <Route path="/catch-the-gift" element={<CatchtheGift />} />
          <Route path="/catchthegift" element={<CatchtheGift />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="/admin-dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
      {!hideHeaderFooter && <BottomNav />}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <WebsiteSettingsProvider>
              <CategoryProvider>
                <ProductProvider>
                  <GameSettingsProvider>
                    <Router>
                      <ScrollToTop />
                      <AppLayout />
                    </Router>
                  </GameSettingsProvider>
                </ProductProvider>
              </CategoryProvider>
            </WebsiteSettingsProvider>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

