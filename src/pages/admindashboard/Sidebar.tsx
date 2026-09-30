import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  Menu,
  X,
  Bell,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Sliders,
  Globe,
  Gamepad2,
  Gift,
  Trophy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { useCategories } from '../../context/CategoryContext';
import chokkuLogo from '../../assets/img/chokku.png';

interface SidebarProps {
  activeSection?: string;
  isMobileSidebarOpen?: boolean;
  setIsMobileSidebarOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection = 'products',
  isMobileSidebarOpen = false,
  setIsMobileSidebarOpen
}) => {
  const { adminLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { products } = useProducts();
  const { categories } = useCategories();

  const [isGameMenuOpen, setIsGameMenuOpen] = useState(true);

  const handleAdminLogout = () => {
    adminLogout();
    navigate('/admin-login');
  };

  // Determine active item based on route or activeSection prop
  const currentPath = location.pathname;
  const isProductsPage = currentPath.includes('/admin-dashboard/products') || activeSection === 'products';

  const navMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
    { id: 'customers', label: 'Customers', icon: Users, path: '/admin-dashboard' },
    { id: 'home-slider', label: 'Homepage Slider', icon: Sliders, path: '/admin-dashboard' },
    { id: 'products', label: 'Products', icon: Package, badge: products.length.toString(), path: '/admin-dashboard/products' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, path: '/admin-dashboard' },
    { id: 'categories', label: 'Categories', icon: Tags, badge: categories.length.toString(), path: '/admin-dashboard' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin-dashboard' },
    { id: 'website-settings', label: 'Website Settings', icon: Globe, path: '/admin-dashboard' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin-dashboard' },
  ];

  return (
    <>
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 h-full overflow-hidden transition-transform duration-300 transform ${
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
              const isActive =
                item.id === 'products'
                  ? isProductsPage
                  : currentPath === item.path && activeSection === item.id;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (setIsMobileSidebarOpen) setIsMobileSidebarOpen(false);
                      navigate(item.path);
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

                  {/* Submenu for Products when on products path */}
                  {item.id === 'products' && isProductsPage && (
                    <div className="ml-4 pl-3 border-l-2 border-[#d2ea9d] my-1 space-y-1">
                      <Link
                        to="/admin-dashboard/products"
                        onClick={() => setIsMobileSidebarOpen && setIsMobileSidebarOpen(false)}
                        className={`block px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentPath === '/admin-dashboard/products'
                            ? 'bg-[#488710] text-white shadow-2xs'
                            : 'text-gray-600 hover:text-[#488710] hover:bg-[#f0f9e8]'
                        }`}
                      >
                        All Products List
                      </Link>
                      <Link
                        to="/admin-dashboard/products/add"
                        onClick={() => setIsMobileSidebarOpen && setIsMobileSidebarOpen(false)}
                        className={`block px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentPath === '/admin-dashboard/products/add'
                            ? 'bg-[#488710] text-white shadow-2xs'
                            : 'text-gray-600 hover:text-[#488710] hover:bg-[#f0f9e8]'
                        }`}
                      >
                        + Add Product
                      </Link>
                    </div>
                  )}
                </div>
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
                <div className="ml-4 pl-3 border-l-2 border-[#d2ea9d] mt-1 space-y-1">
                  <button
                    onClick={() => {
                      if (setIsMobileSidebarOpen) setIsMobileSidebarOpen(false);
                      navigate('/admin-dashboard');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 hover:text-[#488710] hover:bg-[#f0f9e8] transition-all cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Catch the Gift</span>
                  </button>

                  <button
                    onClick={() => {
                      if (setIsMobileSidebarOpen) setIsMobileSidebarOpen(false);
                      navigate('/admin-dashboard');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 hover:text-[#488710] hover:bg-[#f0f9e8] transition-all cursor-pointer"
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
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleAdminLogout}
            className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-extrabold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Admin</span>
          </button>
        </div>

      </aside>

      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen && setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}
    </>
  );
};

export interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  title?: string;
  subtitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeSection = 'products',
}) => {
  const { adminUser } = useAuth();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-screen max-w-full overflow-hidden bg-gray-50 flex flex-col font-sans text-gray-900">

      {/* TOP HEADER BAR */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Left: Mobile Drawer Button & Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 cursor-pointer"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/admin-dashboard" className="flex items-center gap-2.5">
              <img src={chokkuLogo} alt="Chokku Store Logo" className="h-10 w-auto object-contain" />
              <div className="h-6 w-px bg-gray-200 hidden sm:block" />
              <span className="bg-[#eaf8dd] text-[#488710] text-xs font-black px-2.5 py-0.5 rounded-full border border-[#d2ea9d] uppercase tracking-wider hidden sm:inline-block">
                Admin Panel
              </span>
            </Link>
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
            
            {/* View Storefront Link */}
            <button
              onClick={() => navigate('/')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:text-[#609f00] hover:bg-[#f0f9e8] transition-colors border border-gray-200 cursor-pointer"
              title="Open Storefront"
            >
              <span>Main Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

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
      <div className="flex-1 flex overflow-hidden w-full h-full">
        
        {/* SIDEBAR */}
        <Sidebar
          activeSection={activeSection}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />

        {/* MAIN PAGE BODY */}
        <main className="flex-1 min-w-0 h-full p-4 sm:p-6 lg:p-8 bg-gray-50 overflow-y-auto">
          <div className="w-full space-y-6">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};

export default Sidebar;
