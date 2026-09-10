import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShieldCheck, Truck, Clock, RefreshCw, Mail, Phone, MapPin } from 'lucide-react';
import { CATEGORIES } from '../data/categories';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Customer Benefits Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green/20 text-brand-green flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">Free Shipping</h4>
              <p className="text-xs text-gray-400">On all orders over ₹50</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/20 text-brand-blue flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">30-Day Money Back</h4>
              <p className="text-xs text-gray-400">Hassle-free return policy</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green/20 text-brand-green flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">Secure Payment</h4>
              <p className="text-xs text-gray-400">100% encrypted transactions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/20 text-brand-blue flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">24/7 Dedicated Support</h4>
              <p className="text-xs text-gray-400">Instant customer help</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center shadow-md">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-extrabold text-white">
                Eco<span className="text-brand-green">Blue</span> Store
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Your trusted online destination for quality Electronics, Fashion, and Home & Lifestyle products. Premium goods delivered straight to your doorstep with love and care.
            </p>
            <div className="space-y-1.5 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-green" />
                <span>100 Innovation Boulevard, Tech City, NY 10001</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-blue" />
                <span>+1 (800) 555-0199</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-green" />
                <span>support@ecobluestore.com</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 border-l-2 border-brand-green pl-2">
              Categories
            </h4>
            <ul className="space-y-2 text-xs">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="hover:text-brand-green transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/shop" className="hover:text-brand-green transition-colors">
                  Shop All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 border-l-2 border-brand-blue pl-2">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/cart" className="hover:text-brand-blue transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="hover:text-brand-blue transition-colors">
                  Checkout
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-brand-blue transition-colors">
                  Order History
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-brand-blue transition-colors">
                  My Account Profile
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-blue transition-colors">
                  Sign In / Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 border-l-2 border-brand-green pl-2">
              Stay Connected
            </h4>
            <p className="text-xs text-gray-400 mb-3">
              Subscribe to get special discount codes, free giveaways, and weekly deals.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email address..."
                className="w-full px-3 py-2 text-xs bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-brand-green"
              />
              <button
                type="submit"
                className="w-full bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-2 rounded-lg transition-colors"
              >
                Subscribe Now
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© 2026 EcoBlue Store. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-gray-400 cursor-pointer">Shipping & Returns</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
