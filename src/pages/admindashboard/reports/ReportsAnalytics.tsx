import React, { useState, useEffect, useCallback } from 'react';
import { socket } from '../../../socket';
import { safeFetch } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { AdminLayout } from '../Sidebar';
import { LiveVisitorsCard, LiveStatsData } from './LiveVisitorsCard';
import { OverviewCards, TodayOverviewData } from './OverviewCards';
import { DateFilterBar, DatePeriod, ComparisonOption } from './DateFilterBar';
import { VisitorAnalyticsSection, VisitorsAnalyticsData } from './VisitorAnalyticsSection';
import { ProductAnalyticsSection, ProductStatItem } from './ProductAnalyticsSection';
import { CartCheckoutAnalyticsSection, CartCheckoutData } from './CartCheckoutAnalyticsSection';
import { OrdersShippingAnalyticsSection, OrdersShippingData } from './OrdersShippingAnalyticsSection';
import { GamesAnalyticsSection, GamesAnalyticsData } from './GamesAnalyticsSection';
import { InteractiveChartsSection, TimelinePoint, StatusDistributionItem, FunnelItem } from './InteractiveChartsSection';
import { ExportSection } from './ExportSection';
import { Loader2, AlertTriangle, RefreshCw, BarChart3, CheckCircle2 } from 'lucide-react';

export interface DashboardResponseData {
  success: boolean;
  message?: string;
  timestamp: string;
  filters: {
    period: string;
    startDate: string;
    endDate: string;
    compareWith: string;
  };
  liveStats: LiveStatsData;
  todayOverview: TodayOverviewData;
  dateRangeSummary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersGrowth: number;
    revenueGrowth: number;
  };
  visitorsAnalytics: VisitorsAnalyticsData;
  productAnalytics: {
    allProducts: ProductStatItem[];
    mostViewedProducts: ProductStatItem[];
    mostAddedToCartProducts: ProductStatItem[];
    mostPurchasedProducts: ProductStatItem[];
    mostWishlistedProducts: ProductStatItem[];
  };
  cartAndCheckoutAnalytics: CartCheckoutData;
  ordersAndShippingAnalytics: OrdersShippingData;
  gamesAndRewardsAnalytics: GamesAnalyticsData;
  charts: {
    timeline: TimelinePoint[];
    orderStatusDistribution: StatusDistributionItem[];
    conversionFunnel: FunnelItem[];
  };
}

const emptyLiveStats: LiveStatsData = {
  onlineVisitors: 0,
  activeSessions: 0,
  todayVisitors: 0,
  todayPageViews: 0,
  activeShoppingSessions: 0,
  recentActivities: [],
};

const emptyDashboardData: DashboardResponseData = {
  success: true,
  timestamp: new Date().toISOString(),
  filters: {
    period: '30days',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    compareWith: 'previous_period',
  },
  liveStats: emptyLiveStats,
  todayOverview: {
    orders: 0,
    ordersGrowth: 0,
    revenue: 0,
    revenueGrowth: 0,
    visitors: 0,
    pageViews: 0,
    averageOrderValue: 0,
    conversionRate: '0.00',
  },
  dateRangeSummary: {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    ordersGrowth: 0,
    revenueGrowth: 0,
  },
  visitorsAnalytics: {
    totalVisitors: 0,
    uniqueVisitors: 0,
    returningVisitors: 0,
    totalPageViews: 0,
    mostVisitedPages: [],
    hourlyActivity: Array(24).fill(0),
  },
  productAnalytics: {
    allProducts: [],
    mostViewedProducts: [],
    mostAddedToCartProducts: [],
    mostPurchasedProducts: [],
    mostWishlistedProducts: [],
  },
  cartAndCheckoutAnalytics: {
    totalCustomersAddedToCart: 0,
    totalCartAdditions: 0,
    activeCarts: 0,
    abandonedCarts: 0,
    checkoutStarted: 0,
    checkoutCompleted: 0,
    cartToOrderConversionRate: '0%',
    conversionFunnel: [],
  },
  ordersAndShippingAnalytics: {
    todayOrders: 0,
    yesterdayOrders: 0,
    thisWeekOrders: 0,
    thisMonthOrders: 0,
    totalSales: 0,
    totalRevenue: 0,
    codOrders: { count: 0, revenue: 0 },
    onlineOrders: { count: 0, revenue: 0 },
    statusCounts: {},
    shippingStatusReports: [],
    recentOrders: [],
  },
  gamesAndRewardsAnalytics: {
    catchTheGift: { participants: 0, plays: 0, pointsEarned: 0 },
    spinAndWin: { participants: 0, plays: 0, pointsEarned: 0 },
    treasureHunt: { participants: 0, plays: 0, pointsEarned: 0 },
    totalGameParticipants: 0,
    totalGamesPlayed: 0,
    totalPointsEarned: 0,
    totalPointsRedeemed: 0,
    remainingPointsBalance: 0,
    topPlayersLeaderboard: [],
  },
  charts: {
    timeline: [],
    orderStatusDistribution: [],
    conversionFunnel: [],
  },
};

interface ReportsAnalyticsProps {
  embedded?: boolean;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ embedded = false }) => {
  const { adminUser } = useAuth();

  // Filter States
  const [period, setPeriod] = useState<DatePeriod>('30days');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [comparison, setComparison] = useState<ComparisonOption>('previous_period');

  // Loading & Error States
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponseData | null>(null);

  // Live Socket States
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [liveStats, setLiveStats] = useState<LiveStatsData>(emptyLiveStats);

  // Fetch Dashboard Analytics from Backend
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('chokku_admin_token_v2') || '';
      let endpoint = `/analytics/dashboard?period=${period}&compareWith=${comparison}`;
      if (period === 'custom' && customStartDate && customEndDate) {
        endpoint += `&startDate=${encodeURIComponent(customStartDate)}&endDate=${encodeURIComponent(customEndDate)}`;
      }

      const headers: Record<string, string> = {};
      if (token && token.trim()) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }
      const adminIdentifier = adminUser?.id || (adminUser as any)?._id || adminUser?.email || '';
      if (adminIdentifier) {
        headers['x-admin-id'] = String(adminIdentifier);
      }

      const res = await safeFetch<DashboardResponseData>(endpoint, {
        headers,
      });

      if (res.ok && res.isJson && res.data && res.data.success) {
        setDashboardData(res.data);
        if (res.data.liveStats) {
          setLiveStats((prev) => ({
            ...prev,
            ...res.data!.liveStats,
          }));
        }
      } else {
        const errorMsg = res.data?.message || res.error || 'Failed to fetch live database analytics';
        console.warn('Analytics fetch notice:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.warn('Could not refresh analytics from backend:', err);
      setError(err?.message || 'Error connecting to analytics service');
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [period, customStartDate, customEndDate, comparison, adminUser?.id]);

  // Initial load and filter change trigger
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Socket.IO Real-Time Connection and Live Visitor Updates
  useEffect(() => {
    const handleConnect = () => {
      setIsSocketConnected(true);
      socket.emit('join_admin_analytics');
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleLiveStats = (stats: LiveStatsData) => {
      if (stats) {
        setLiveStats((prev) => ({
          ...prev,
          ...stats,
          recentActivities: stats.recentActivities || prev.recentActivities || [],
        }));
      }
    };

    // Join admin room immediately if already connected
    if (socket.connected) {
      setIsSocketConnected(true);
      socket.emit('join_admin_analytics');
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('analytics_live_stats', handleLiveStats);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('analytics_live_stats', handleLiveStats);
    };
  }, []);

  // Handlers for DateFilterBar
  const handlePeriodChange = (newPeriod: DatePeriod) => {
    setPeriod(newPeriod);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setPeriod('custom');
  };

  const currentData = dashboardData || emptyDashboardData;

  // Main Content Elements
  const content = (
    <div className="w-full space-y-6 pb-12 animate-fade-in font-sans">
      
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#488710]" />
            <span>Reports & Analytics</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Real-time traffic metrics, live orders, conversion funnels, and store performance directly from MongoDB
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#488710]" />
              <span>Syncing MongoDB Atlas...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#488710]" />
              <span>Live Database Connected</span>
            </span>
          )}
        </div>
      </div>

      {/* 1. LIVE VISITORS – MUST BE AT THE TOP (TOP PRIORITY) */}
      <LiveVisitorsCard
        liveStats={liveStats}
        isSocketConnected={isSocketConnected}
      />

      {/* Error state alert if any */}
      {error && !dashboardData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">Database Connection Notice</h4>
              <p className="text-xs text-amber-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchAnalytics()}
            className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shrink-0 cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Initial Loading Skeleton */}
      {isInitialLoad && !dashboardData ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#488710] mx-auto" />
            <p className="text-sm font-bold text-gray-800">Loading store analytics directly from MongoDB...</p>
            <p className="text-xs text-gray-400">Fetching live orders, traffic sessions, and catalog intelligence</p>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Today's Overview Cards */}
          <OverviewCards overview={currentData.todayOverview} />

          {/* 3. Global Date Filter */}
          <DateFilterBar
            period={period}
            onPeriodChange={handlePeriodChange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomDateChange={handleCustomDateChange}
            comparison={comparison}
            onComparisonChange={setComparison}
            onRefresh={fetchAnalytics}
            isLoading={isLoading}
          />

          {/* 4. Website Visitor Analytics */}
          <VisitorAnalyticsSection data={currentData.visitorsAnalytics} />

          {/* 5. Product Analytics */}
          <ProductAnalyticsSection
            allProducts={currentData.productAnalytics.allProducts}
            mostViewed={currentData.productAnalytics.mostViewedProducts}
            mostAddedToCart={currentData.productAnalytics.mostAddedToCartProducts}
            mostPurchased={currentData.productAnalytics.mostPurchasedProducts}
            mostWishlisted={currentData.productAnalytics.mostWishlistedProducts}
          />

          {/* 6. Cart & Checkout Analytics */}
          <CartCheckoutAnalyticsSection data={currentData.cartAndCheckoutAnalytics} />

          {/* 7. Orders & Shipping Analytics */}
          <OrdersShippingAnalyticsSection data={currentData.ordersAndShippingAnalytics} />

          {/* 8. Games & Rewards Analytics */}
          <GamesAnalyticsSection data={currentData.gamesAndRewardsAnalytics} />

          {/* 9. Revenue & Conversion Charts */}
          <InteractiveChartsSection
            timeline={currentData.charts.timeline}
            orderStatusDistribution={currentData.charts.orderStatusDistribution}
            conversionFunnel={currentData.charts.conversionFunnel}
          />

          {/* 10. Detailed Reports and Export */}
          <ExportSection
            period={period}
            startDate={period === 'custom' ? customStartDate : undefined}
            endDate={period === 'custom' ? customEndDate : undefined}
          />
        </>
      )}

    </div>
  );

  // If embedded within AdminDashboard, return bare content
  if (embedded) {
    return content;
  }

  // Otherwise, wrap in AdminLayout for standalone route /admin-dashboard/reports
  return (
    <AdminLayout activeSection="reports" title="Reports & Analytics">
      {content}
    </AdminLayout>
  );
};

export default ReportsAnalytics;
