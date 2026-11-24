import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ServerStatusProvider, useServerStatus } from './context/ServerStatusContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';
import { WebsiteSettingsProvider } from './context/WebsiteSettingsContext';
import { CategoryProvider } from './context/CategoryContext';
import { ProductProvider, useProducts } from './context/ProductContext';

import { GameSettingsProvider } from './context/GameSettingsContext';
import { SpinGameProvider } from './context/SpinGameContext';

import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';

import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { WelcomeModal } from './components/WelcomeModal';

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
import { SpinandWin } from './pages/SpinandWin';
import { Carroms } from './pages/Carroms';
import { NotFound } from './pages/NotFound';
import { AdminLogin } from './pages/admindashboard/AdminLogin';
import { AdminDashboard } from './pages/admindashboard/AdminDashboard';
import { ProductList } from './pages/admindashboard/product/ProductList';
import { ProductAdd } from './pages/admindashboard/product/ProductAdd';
import { ProductEdit } from './pages/admindashboard/product/ProductEdit';
import { ProductView } from './pages/admindashboard/product/ProductView';
import { ReportsAnalytics } from './pages/admindashboard/reports/ReportsAnalytics';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { useVisitorTracking } from './hooks/useVisitorTracking';

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
  useVisitorTracking();
  const { pathname } = useLocation();
  const { isServerConnected } = useServerStatus();
  const { products: storeProducts } = useProducts();
  
  // Hide Navbar & Footer on Admin pages, Carroms full-screen game, or when server is busy
  const isCarromsGame = pathname === '/carroms' || pathname === '/carrom';
  const isServerBusyScreen = !isServerConnected && storeProducts.length === 0;
  const hideHeaderFooter = pathname.startsWith('/admin') || isServerBusyScreen || isCarromsGame;
  const isCheckout = pathname === '/checkout';
  const isLoginPage = pathname.toLowerCase().replace(/\/+$/, '') === '/login';
  const hideFooter = hideHeaderFooter || isCheckout || isLoginPage || isCarromsGame;
  const hideBottomNav = hideHeaderFooter || isCheckout || isCarromsGame;
  const hideBottomPadding = isCheckout || isCarromsGame;

  return (
    <div className={`min-h-screen flex flex-col bg-white text-gray-900 font-sans antialiased ${hideBottomPadding ? 'pb-0' : 'pb-16 lg:pb-0'} ${isCarromsGame ? 'h-screen w-screen overflow-hidden' : ''}`}>
      {!hideHeaderFooter && <Navbar className={isLoginPage ? 'hidden lg:block' : ''} />}
      <main className={`flex-1 flex flex-col ${isCarromsGame ? 'h-full w-full overflow-hidden' : ''}`}>
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
          <Route path="/spin-and-win" element={<SpinandWin />} />
          <Route path="/spinandwin" element={<SpinandWin />} />
          <Route path="/carroms" element={<Carroms />} />
          <Route path="/carrom" element={<Carroms />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="/admin-dashboard/reports"
            element={
              <AdminProtectedRoute>
                <ReportsAnalytics />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard/analytics"
            element={<Navigate to="/admin-dashboard/reports" />}
          />
          <Route
            path="/admin-dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard/products"
            element={
              <AdminProtectedRoute>
                <ProductList />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard/products/add"
            element={
              <AdminProtectedRoute>
                <ProductAdd />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard/products/edit/:id"
            element={
              <AdminProtectedRoute>
                <ProductEdit />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard/products/view/:id"
            element={
              <AdminProtectedRoute>
                <ProductView />
              </AdminProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
      {!hideBottomNav && <BottomNav />}
      <ToastContainer />
      <WelcomeModal />
    </div>
  );
};

export default function App() {
  return (
    <ServerStatusProvider>
      <ToastProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <WebsiteSettingsProvider>
                <CategoryProvider>
                  <ProductProvider>
                    <GameSettingsProvider>
                      <SpinGameProvider>
                        <Router>
                          <ScrollToTop />
                          <AppLayout />
                        </Router>
                      </SpinGameProvider>
                    </GameSettingsProvider>
                  </ProductProvider>
                </CategoryProvider>
              </WebsiteSettingsProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ToastProvider>
    </ServerStatusProvider>
  );
}

