import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, Gamepad2, Package, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex justify-around items-end">
      {/* 1. Home */}
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            isActive ? 'text-[#488710] font-bold' : 'text-gray-500 hover:text-gray-800'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Home className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-[#488710]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-1 font-semibold tracking-tight">Home</span>
          </>
        )}
      </NavLink>

      {/* 2. Categories */}
      <NavLink
        to="/shop"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            isActive ? 'text-[#488710] font-bold' : 'text-gray-500 hover:text-gray-800'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <LayoutGrid className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-[#488710]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-1 font-semibold tracking-tight">Categories</span>
          </>
        )}
      </NavLink>

      {/* 3. Play & Win (Elevated Central Button) */}
      <NavLink
        to="/play-and-win"
        className="flex flex-col items-center justify-center flex-1 relative -top-3 group"
      >
        {({ isActive }) => (
          <>
            <div
              className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 ${
                isActive
                  ? 'bg-[#488710] text-white ring-4 ring-[#488710]/20'
                  : 'bg-white text-[#488710] border-2 border-[#488710] ring-4 ring-white'
              }`}
            >
              <Gamepad2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span
              className={`text-[10px] mt-0.5 font-bold tracking-tight ${
                isActive ? 'text-[#488710]' : 'text-gray-700'
              }`}
            >
              Play &amp; Win
            </span>
          </>
        )}
      </NavLink>

      {/* 4. Orders */}
      <NavLink
        to="/orders"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            isActive ? 'text-[#488710] font-bold' : 'text-gray-500 hover:text-gray-800'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Package className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-[#488710]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-1 font-semibold tracking-tight">Orders</span>
          </>
        )}
      </NavLink>

      {/* 5. Profile */}
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            isActive ? 'text-[#488710] font-bold' : 'text-gray-500 hover:text-gray-800'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <User className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-[#488710]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-1 font-semibold tracking-tight">Profile</span>
          </>
        )}
      </NavLink>
    </div>
  );
};
