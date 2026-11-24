import React, { useState } from 'react';
import { TrendingUp, BarChart3, PieChart, Users, DollarSign, Eye, ShoppingCart, Layers, Gamepad2 } from 'lucide-react';

export interface TimelinePoint {
  date: string;
  label: string;
  orders: number;
  revenue: number;
  visitors: number;
  pageViews: number;
  productViews: number;
  cartAdditions: number;
  gamePlays: number;
}

export interface StatusDistributionItem {
  name: string;
  value: number;
  percentage: number;
}

export interface FunnelItem {
  stage: string;
  count: number;
  rate: string;
}

interface InteractiveChartsSectionProps {
  timeline: TimelinePoint[];
  orderStatusDistribution: StatusDistributionItem[];
  conversionFunnel: FunnelItem[];
}

export const InteractiveChartsSection: React.FC<InteractiveChartsSectionProps> = ({
  timeline = [],
  orderStatusDistribution = [],
  conversionFunnel = [],
}) => {
  const safeTimeline = Array.isArray(timeline) ? timeline : [];
  const safeStatusDist = Array.isArray(orderStatusDistribution) ? orderStatusDistribution : [];
  const safeFunnel = Array.isArray(conversionFunnel) ? conversionFunnel : [];

  const [activeChartTab, setActiveChartTab] = useState<'sales' | 'visitors' | 'products' | 'games'>('sales');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Status colors map
  const statusColors: Record<string, string> = {
    Pending: '#f97316',
    Confirmed: '#06b6d4',
    Processing: '#eab308',
    Shipped: '#3b82f6',
    'Out for Delivery': '#a855f7',
    Delivered: '#10b981',
    Cancelled: '#ef4444',
    Returned: '#64748b',
  };

  // Helper for generating SVG Area Chart points
  const pointsCount = safeTimeline.length || 1;
  const width = 800;
  const height = 260;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Max values for currently active chart
  let metricKeys: Array<{ key: keyof TimelinePoint; color: string; label: string; format?: 'currency' | 'number' }> = [];
  if (activeChartTab === 'sales') {
    metricKeys = [
      { key: 'revenue', color: '#488710', label: 'Revenue (₹)', format: 'currency' },
      { key: 'orders', color: '#0284c7', label: 'Orders Count', format: 'number' },
    ];
  } else if (activeChartTab === 'visitors') {
    metricKeys = [
      { key: 'visitors', color: '#6366f1', label: 'Unique Visitors', format: 'number' },
      { key: 'pageViews', color: '#f59e0b', label: 'Total Page Views', format: 'number' },
    ];
  } else if (activeChartTab === 'products') {
    metricKeys = [
      { key: 'productViews', color: '#3b82f6', label: 'Product Views', format: 'number' },
      { key: 'cartAdditions', color: '#10b981', label: 'Cart Additions', format: 'number' },
    ];
  } else if (activeChartTab === 'games') {
    metricKeys = [
      { key: 'gamePlays', color: '#ec4899', label: 'Games Played', format: 'number' },
      { key: 'visitors', color: '#8b5cf6', label: 'Active Visitors', format: 'number' },
    ];
  }

  const primaryMetric = metricKeys[0];
  const primaryValues = safeTimeline.map((p) => Number(p[primaryMetric.key]) || 0);
  const maxPrimaryVal = Math.max(...primaryValues, 5);

  const getX = (idx: number) => {
    if (pointsCount <= 1) return paddingX + chartW / 2;
    return paddingX + (idx / (pointsCount - 1)) * chartW;
  };

  const getY = (val: number, maxVal: number) => {
    return height - paddingY - (val / (maxVal || 1)) * chartH;
  };

  // Create SVG path for line and area
  const createPath = (dataKey: keyof TimelinePoint, maxVal: number) => {
    if (safeTimeline.length === 0) return { line: '', area: '' };

    const pts = safeTimeline.map((p, i) => {
      const x = getX(i);
      const y = getY(Number(p[dataKey]) || 0, maxVal);
      return `${x},${y}`;
    });

    const line = `M ${pts.join(' L ')}`;
    const firstX = getX(0);
    const lastX = getX(safeTimeline.length - 1);
    const bottomY = height - paddingY;
    const area = `M ${pts.join(' L ')} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;

    return { line, area };
  };

  const primaryPaths = createPath(primaryMetric.key, maxPrimaryVal);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
          <span>Revenue, Trends & Conversion Charts</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Interactive Visualizations
          </span>
        </h3>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Dynamic trends for sales, visitors, product interest, order status distribution and funnel
        </p>
      </div>

      {/* Main Interactive Timeline Area Chart */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
        
        {/* Chart Header Bar with Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#488710]" />
              <span>Timeline Activity Trends</span>
            </h4>
            <p className="text-xs text-gray-400 font-medium">
              Hover over any point to inspect detailed daily figures
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center flex-wrap gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => { setActiveChartTab('sales'); setHoveredPointIndex(null); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'sales'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sales & Orders
            </button>
            <button
              onClick={() => { setActiveChartTab('visitors'); setHoveredPointIndex(null); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'visitors'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Visitors & Views
            </button>
            <button
              onClick={() => { setActiveChartTab('products'); setHoveredPointIndex(null); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'products'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Views vs Cart
            </button>
            <button
              onClick={() => { setActiveChartTab('games'); setHoveredPointIndex(null); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'games'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Game Activity
            </button>
          </div>
        </div>

        {/* SVG Area Chart */}
        <div className="relative pt-4 overflow-hidden">
          {/* Hover Details Card */}
          {hoveredPointIndex !== null && safeTimeline[hoveredPointIndex] && (
            <div className="absolute top-2 right-4 bg-gray-900 text-white rounded-xl px-3 py-2 text-xs shadow-lg z-20 pointer-events-none">
              <span className="text-[10px] text-gray-400 font-mono block">
                {safeTimeline[hoveredPointIndex].date} ({safeTimeline[hoveredPointIndex].label})
              </span>
              <div className="flex items-center gap-3 mt-1 font-bold">
                {metricKeys.map((m) => {
                  const rawVal = Number(safeTimeline[hoveredPointIndex!][m.key]) || 0;
                  const display = m.format === 'currency' ? formatCurrency(rawVal) : rawVal.toLocaleString();
                  return (
                    <span key={String(m.key)} style={{ color: m.color }}>
                      {m.label}: {display}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-64 sm:h-72 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primaryMetric.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={primaryMetric.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingY + pct * chartH;
              return (
                <line
                  key={i}
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              );
            })}

            {/* Filled Area */}
            {primaryPaths.area && (
              <path d={primaryPaths.area} fill="url(#chartGradient)" />
            )}

            {/* Line Path */}
            {primaryPaths.line && (
              <path
                d={primaryPaths.line}
                fill="none"
                stroke={primaryMetric.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Points */}
            {safeTimeline.map((point, idx) => {
              const cx = getX(idx);
              const cy = getY(Number(point[primaryMetric.key]) || 0, maxPrimaryVal);
              const isHovered = hoveredPointIndex === idx;

              return (
                <g key={idx}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 3.5}
                    fill="#ffffff"
                    stroke={primaryMetric.color}
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  />
                  {/* Invisible larger hover hit area */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={18}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* X Axis Date Labels */}
          <div className="flex justify-between text-[11px] text-gray-400 font-mono pt-2 px-6">
            <span>{safeTimeline[0]?.label || ''}</span>
            {safeTimeline.length > 2 && (
              <span>{safeTimeline[Math.floor(safeTimeline.length / 2)]?.label || ''}</span>
            )}
            <span>{safeTimeline[safeTimeline.length - 1]?.label || ''}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-100 text-xs font-bold text-gray-600">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: primaryMetric.color }}
            />
            <span>{primaryMetric.label}</span>
          </div>
        </div>

      </div>

      {/* Two-Column Bottom Row: Order Status Distribution & Conversion Funnel Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Order Status Distribution (Donut style) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-extrabold text-gray-900">Order Status Distribution</h4>
              </div>
              <span className="text-[10px] font-bold text-gray-400">By Status Split</span>
            </div>

            <div className="space-y-3 pt-2">
              {safeStatusDist.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No order records in this period.</p>
              ) : (
                safeStatusDist.map((item) => {
                  const color = statusColors[item.name] || '#64748b';
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span>{item.name}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-extrabold">{item.value} orders</span>
                          <span className="text-gray-400 text-[10px]">({item.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(5, item.percentage)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Product Views vs Cart Additions comparison bar */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-extrabold text-gray-900">Product Views vs Cart Additions</h4>
              </div>
              <span className="text-[10px] font-bold text-gray-400">Intent Comparison</span>
            </div>

            <p className="text-xs text-gray-500 font-medium mb-4">
              Comparison between product catalog discovery (views) and commercial purchase intent (cart adds)
            </p>

            <div className="space-y-4">
              {safeTimeline.slice(-5).map((point) => {
                const maxVal = Math.max(point.productViews, point.cartAdditions, 1);
                const viewPct = (point.productViews / maxVal) * 100;
                const cartPct = (point.cartAdditions / maxVal) * 100;

                return (
                  <div key={point.date} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                      <span>{point.label}</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-blue-600 font-black">{point.productViews} views</span>
                        <span className="text-emerald-600 font-black">{point.cartAdditions} carts</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${Math.max(5, viewPct)}%` }}
                        />
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.max(5, cartPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-100 text-xs font-bold text-gray-600 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Catalog Views</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Cart Additions</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

