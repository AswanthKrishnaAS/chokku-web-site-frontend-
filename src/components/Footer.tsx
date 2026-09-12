import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import chokkuLogo from '../assets/img/chokku.png';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';

export const Footer: React.FC = () => {
  const { navbarLogo } = useWebsiteSettings();

  return (
    <footer className="bg-[#0b192c] text-white border-t border-[#1e293b] pt-10 pb-8 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center space-y-5">
        
        {/* Chokku Store Logo (With White Card Badge for crisp visibility on Dark Blue) */}
        <Link to="/" className="inline-block transition-transform hover:scale-105">
          <div className="bg-white/95 px-4 py-2 rounded-2xl shadow-md border border-slate-700/50 flex items-center justify-center">
            <img
              src={navbarLogo || chokkuLogo}
              alt="Chokku Store Logo"
              className="h-10 sm:h-12 w-auto object-contain max-w-[180px]"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== chokkuLogo) {
                  target.src = chokkuLogo;
                }
              }}
            />
          </div>
        </Link>

        {/* Main Navigation Links */}
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-300">
          <Link to="/" className="hover:text-[#609f00] transition-colors">
            Home
          </Link>
          <Link to="/shop" className="hover:text-[#609f00] transition-colors">
            Shop
          </Link>
          <Link to="/play-and-win" className="hover:text-[#609f00] transition-colors">
            Play &amp; Win
          </Link>
          <Link to="/orders" className="hover:text-[#609f00] transition-colors">
            Orders
          </Link>
          <Link to="/profile" className="hover:text-[#609f00] transition-colors">
            Profile
          </Link>
        </div>

        {/* Policy & Legal Links */}
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-5 text-xs font-medium text-slate-400">
          <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
          <span className="text-slate-600">•</span>
          <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
          <span className="text-slate-600">•</span>
          <span className="hover:text-white cursor-pointer transition-colors">Shipping &amp; Returns</span>
          <span className="text-slate-600">•</span>
          <span className="hover:text-white cursor-pointer transition-colors">Contact Us</span>
        </div>

        {/* Social Media Icons (Instagram, Facebook, Twitter, Youtube) */}
        <div className="flex items-center justify-center gap-3.5 pt-1">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-slate-800/90 hover:bg-[#609f00] text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all hover:scale-110 shadow-sm"
            aria-label="Instagram"
          >
            <Instagram className="w-4 h-4 stroke-[2]" />
          </a>

          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-slate-800/90 hover:bg-[#609f00] text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all hover:scale-110 shadow-sm"
            aria-label="Facebook"
          >
            <Facebook className="w-4 h-4 stroke-[2]" />
          </a>

          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-slate-800/90 hover:bg-[#609f00] text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all hover:scale-110 shadow-sm"
            aria-label="Twitter"
          >
            <Twitter className="w-4 h-4 stroke-[2]" />
          </a>

          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-slate-800/90 hover:bg-[#609f00] text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all hover:scale-110 shadow-sm"
            aria-label="YouTube"
          >
            <Youtube className="w-4 h-4 stroke-[2]" />
          </a>
        </div>

        {/* Copyright */}
        <p className="text-[11px] sm:text-xs text-slate-400 font-medium pt-2">
          © {new Date().getFullYear()} Chokku Store. All rights reserved.
        </p>

      </div>
    </footer>
  );
};
