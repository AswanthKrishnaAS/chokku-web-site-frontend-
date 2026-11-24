import React from 'react';
import { ShoppingBag, IndianRupee, TrendingUp, TrendingDown, Target, CreditCard } from 'lucide-react';

export interface TodayOverviewData {
  orders: number;
  ordersGrowth: number;
  revenue: number;
  revenueGrowth: number;
  visitors: number;
  pageViews: number;
  averageOrderValue: number;
  conversionRate: string;
}

interface OverviewCardsProps {
  overview?: TodayOverviewData;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  overview = {
    orders: 0,
    ordersGrowth: 0,
    revenue: 0,
    revenueGrowth: 0,
    visitors: 0,
    pageViews: 0,
    averageOrderValue: 0,
    conversionRate: '0.00',
  },
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const renderGrowthBadge = (growth: number = 0) => {
    const isPositive = growth >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
          isPositive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}
      >
        <Icon className="w-3 h-3" />
        <span>{isPositive ? `+${growth}%` : `${growth}%`}</span>
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>Today's Performance Overview</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f0f9e8] text-[#488710] border border-[#d2ea9d]">
              Live Day Tracker
            </span>
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Key store milestones achieved today compared to yesterday
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Orders */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Today's Orders</span>
            </span>
            {renderGrowthBadge(overview?.ordersGrowth)}
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">
            {overview?.orders || 0}
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1.5">
            Orders received since midnight
          </p>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-[#488710]" />
              <span>Today's Revenue</span>
            </span>
            {renderGrowthBadge(overview?.revenueGrowth)}
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">
            {formatCurrency(overview?.revenue || 0)}
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1.5">
            Gross sales volume generated today
          </p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>Average Order Value</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              AOV
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">
            {formatCurrency(overview?.averageOrderValue || 0)}
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1.5">
            Average basket spending per checkout
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Conversion Rate</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Today
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">
            {overview?.conversionRate || '0.00'}%
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1.5">
            Orders completed / Visitors today
          </p>
        </div>
      </div>
    </div>
  );
};
