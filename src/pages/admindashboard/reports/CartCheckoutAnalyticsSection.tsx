import React from 'react';
import { ShoppingCart, ShoppingBag, ArrowRight, UserCheck, TrendingUp, Layers, AlertCircle } from 'lucide-react';

export interface CartCheckoutData {
  totalCustomersAddedToCart: number;
  totalCartAdditions: number;
  activeCarts: number;
  abandonedCarts: number;
  checkoutStarted: number;
  checkoutCompleted: number;
  cartToOrderConversionRate: string;
  conversionFunnel: Array<{
    stage: string;
    count: number;
    rate: string;
  }>;
}

interface CartCheckoutAnalyticsSectionProps {
  data?: CartCheckoutData;
}

export const CartCheckoutAnalyticsSection: React.FC<CartCheckoutAnalyticsSectionProps> = ({
  data = {
    totalCustomersAddedToCart: 0,
    totalCartAdditions: 0,
    activeCarts: 0,
    abandonedCarts: 0,
    checkoutStarted: 0,
    checkoutCompleted: 0,
    cartToOrderConversionRate: '0%',
    conversionFunnel: [],
  },
}) => {
  const safeData = data || {
    totalCustomersAddedToCart: 0,
    totalCartAdditions: 0,
    activeCarts: 0,
    abandonedCarts: 0,
    checkoutStarted: 0,
    checkoutCompleted: 0,
    cartToOrderConversionRate: '0%',
    conversionFunnel: [],
  };

  const funnel = Array.isArray(safeData.conversionFunnel) ? safeData.conversionFunnel : [];
  const maxFunnelCount = Math.max(...funnel.map((f) => Number(f.count) || 0), 1);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
          <span>Cart & Checkout Analytics</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Conversion Flow
          </span>
        </h3>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Cart additions, drop-off rates, active carts, and customer checkout journey
        </p>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Customers Added to Cart */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Shoppers Added
          </span>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {(Number(safeData.totalCustomersAddedToCart) || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400">Unique customers</span>
        </div>

        {/* Total Cart Additions */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Cart Additions
          </span>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {(Number(safeData.totalCartAdditions) || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400">Total item clicks</span>
        </div>

        {/* Active Carts */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Active Carts
          </span>
          <div className="text-2xl font-black text-indigo-600 tracking-tight">
            {(Number(safeData.activeCarts) || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400">Live shopping now</span>
        </div>

        {/* Abandoned Carts */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Abandoned
          </span>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {(Number(safeData.abandonedCarts) || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400">Carts unpurchased</span>
        </div>

        {/* Checkout Started */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Checkouts Started
          </span>
          <div className="text-2xl font-black text-blue-600 tracking-tight">
            {(Number(safeData.checkoutStarted) || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400">Initiated order flow</span>
        </div>

        {/* Cart-to-Order Conversion Rate */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Cart Conversion
          </span>
          <div className="text-2xl font-black text-[#488710] tracking-tight">
            {safeData.cartToOrderConversionRate || '0%'}
          </div>
          <span className="text-[10px] text-[#488710] font-bold">Cart to order rate</span>
        </div>
      </div>

      {/* Visual Conversion Funnel Card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-extrabold text-gray-900">E-Commerce Customer Conversion Funnel</h4>
          </div>
          <span className="text-xs font-bold text-gray-400">Step-by-Step Flow</span>
        </div>

        <div className="space-y-3 pt-2">
          {funnel.map((step, idx) => {
            const stepCount = Number(step.count) || 0;
            const widthPct = maxFunnelCount > 0 ? (stepCount / maxFunnelCount) * 100 : 0;
            const colors = [
              'bg-blue-500',
              'bg-indigo-500',
              'bg-emerald-500',
              'bg-amber-500',
              'bg-[#488710]',
            ];
            const colorClass = colors[idx % colors.length];

            return (
              <div key={`${step.stage}-${idx}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{step.stage}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-900">{stepCount.toLocaleString()}</span>
                    <span className="text-[11px] font-bold text-gray-400">({step.rate})</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(widthPct, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
