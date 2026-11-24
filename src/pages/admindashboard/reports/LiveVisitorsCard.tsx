import React from 'react';
import { Users, Eye, ShoppingCart, Activity, Wifi, Radio, Smartphone, Monitor } from 'lucide-react';

export interface LiveStatsData {
  onlineVisitors: number;
  activeSessions: number;
  todayVisitors: number;
  todayPageViews: number;
  activeShoppingSessions: number;
  recentActivities?: Array<{
    id: string;
    type: string;
    visitorId: string;
    userName?: string;
    page?: string;
    deviceType?: string;
    browser?: string;
    message?: string;
    timestamp: string;
  }>;
  timestamp?: string;
}

interface LiveVisitorsCardProps {
  liveStats?: LiveStatsData;
  isSocketConnected?: boolean;
}

export const LiveVisitorsCard: React.FC<LiveVisitorsCardProps> = ({
  liveStats = {
    onlineVisitors: 0,
    activeSessions: 0,
    todayVisitors: 0,
    todayPageViews: 0,
    activeShoppingSessions: 0,
    recentActivities: [],
  },
  isSocketConnected = true,
}) => {
  const activities = liveStats?.recentActivities || [];

  const formatTimeAgo = (ts?: string) => {
    if (!ts) return 'just now';
    try {
      const parsedTime = new Date(ts).getTime();
      if (isNaN(parsedTime)) return 'just now';
      const diff = Math.max(0, Math.floor((Date.now() - parsedTime) / 1000));
      if (diff < 5) return 'just now';
      if (diff < 60) return `${diff}s ago`;
      const mins = Math.floor(diff / 60);
      if (mins < 60) return `${mins}m ago`;
      return `${Math.floor(mins / 60)}h ago`;
    } catch {
      return 'just now';
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-5">
      {/* Header Bar: Live Badge & Real-Time Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0f9e8] border border-[#d2ea9d] text-[#488710] font-black text-xs uppercase tracking-wider shadow-2xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#488710]"></span>
            </span>
            <span>LIVE REAL-TIME VISITORS</span>
          </div>
          <span className="text-gray-400 text-xs hidden sm:inline-block font-medium">
            Automatic real-time WebSocket updates
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
              isSocketConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isSocketConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Socket Connected</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                <span>Connecting Socket...</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Main Stats Grid: 4 Core Live Cards matching existing Admin Dashboard styles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Currently Online Visitors */}
        <div className="bg-gradient-to-br from-[#f0f9e8]/50 to-white rounded-xl p-4 sm:p-5 border border-[#d2ea9d] shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Currently Online</span>
            <div className="w-10 h-10 rounded-xl bg-[#f0f9e8] text-[#488710] border border-[#d2ea9d] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-gray-900 tabular-nums">
              {liveStats.onlineVisitors || 0}
            </h3>
            <span className="text-[11px] font-extrabold text-[#488710] bg-[#f0f9e8] px-2 py-0.5 rounded-md border border-[#d2ea9d]">
              Live Now
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            Active unique visitors browsing across all tabs
          </p>
        </div>

        {/* Card 2: Total Visitors Today */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Visitors Today</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-gray-900 tabular-nums">
              {liveStats.todayVisitors || 0}
            </h3>
            <span className="text-[11px] font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
              Today
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            Cumulative unique visitors tracked since midnight
          </p>
        </div>

        {/* Card 3: Total Page Views Today */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Page Views Today</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-gray-900 tabular-nums">
              {liveStats.todayPageViews || 0}
            </h3>
            <span className="text-[11px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              Views
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            Total page impressions recorded on store today
          </p>
        </div>

        {/* Card 4: Active Shopping Sessions */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Shopping Carts</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-gray-900 tabular-nums">
              {liveStats.activeShoppingSessions || 0}
            </h3>
            <span className="text-[11px] font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
              In Cart
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            Sessions with products added in cart right now
          </p>
        </div>

      </div>

      {/* Real-Time Visitor Activity Stream Ticker */}
      <div className="pt-3 border-t border-gray-100 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-gray-700 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#488710]" />
            <span>Real-Time Visitor Activity Stream</span>
          </span>
          <span className="text-[10px] text-gray-400">Live feed updates automatically</span>
        </div>

        {activities.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200/80 text-xs text-gray-500 flex items-center justify-between">
            <span>Waiting for active visitors... Monitoring storefront activity.</span>
            <span className="text-[10px] font-bold text-[#488710] bg-[#f0f9e8] px-2 py-0.5 rounded-full border border-[#d2ea9d]">
              Ready
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {activities.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 hover:bg-gray-100/80 transition-colors rounded-xl p-2.5 border border-gray-200 flex items-center justify-between gap-2.5 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 text-gray-600">
                    {item.deviceType === 'Mobile' ? (
                      <Smartphone className="w-3.5 h-3.5" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate leading-tight">
                      {item.userName || item.message || 'Visitor activity'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5 font-mono">
                      {item.page || '/'} • {item.browser || 'Browser'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium shrink-0">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
