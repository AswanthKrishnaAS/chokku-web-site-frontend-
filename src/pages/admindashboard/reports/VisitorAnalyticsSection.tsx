import React, { useState } from 'react';
import { Users, UserPlus, UserCheck, Eye, Compass, Clock } from 'lucide-react';

export interface VisitorsAnalyticsData {
  totalVisitors: number;
  uniqueVisitors: number;
  returningVisitors: number;
  totalPageViews: number;
  mostVisitedPages: Array<{
    page?: string;
    path?: string;
    title?: string;
    views: number;
    percentage: number;
  }>;
  hourlyActivity: number[] | Array<{ hour?: number; label?: string; visitors?: number; count?: number }>; // 24 hours
}

interface VisitorAnalyticsSectionProps {
  data?: VisitorsAnalyticsData;
}

export const VisitorAnalyticsSection: React.FC<VisitorAnalyticsSectionProps> = ({
  data = {
    totalVisitors: 0,
    uniqueVisitors: 0,
    returningVisitors: 0,
    totalPageViews: 0,
    mostVisitedPages: [],
    hourlyActivity: Array(24).fill(0),
  },
}) => {
  const [hoveredHour, setHoveredHour] = useState<{ hour: number; count: number } | null>(null);

  const rawHourly = Array.isArray(data?.hourlyActivity) ? data.hourlyActivity : Array(24).fill(0);
  const normalizedHourly = Array.from({ length: 24 }).map((_, i) => {
    const raw = rawHourly[i];
    if (typeof raw === 'number') return Number(raw) || 0;
    if (raw && typeof raw === 'object') {
      return Number(raw.visitors ?? (raw as any).count ?? (raw as any).views ?? 0) || 0;
    }
    return 0;
  });

  const mostVisitedPages = Array.isArray(data?.mostVisitedPages) ? data.mostVisitedPages : [];
  const hourlyMax = Math.max(...normalizedHourly, 1);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
          <span>Website Visitor Analytics</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Traffic & Behavior
          </span>
        </h3>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Audience engagement, unique reach, returning customer loyalty and hourly traffic trends
        </p>
      </div>

      {/* 4 Core Traffic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visitors */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Total Visitors</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Total
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">
            {(Number(data?.totalVisitors) || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1.5">
            Total website sessions in selected period
          </p>
        </div>

        {/* Unique Visitors */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Unique Visitors</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Unique
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">
            {(Number(data?.uniqueVisitors) || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1.5">
            Distinct individuals tracked across devices
          </p>
        </div>

        {/* Returning Visitors */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>Returning Visitors</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Repeat
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">
            {(Number(data?.returningVisitors) || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1.5">
            Customers with repeated store visits
          </p>
        </div>

        {/* Total Page Views */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-600" />
              <span>Total Page Views</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Views
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">
            {(Number(data?.totalPageViews) || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1.5">
            Cumulative store content impressions
          </p>
        </div>
      </div>

      {/* Two-column layout: Most Visited Pages Table & Visitor Activity By Hour */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Most Visited Pages Table */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#488710]" />
              <h4 className="text-sm font-extrabold text-gray-900">Most Visited Pages</h4>
            </div>
            <span className="text-[10px] font-bold text-gray-400">By Total Views</span>
          </div>

          <div className="space-y-3">
            {mostVisitedPages.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No page views recorded in this range.</p>
            ) : (
              mostVisitedPages.map((item, idx) => {
                const pagePath = item.page || item.path || `page-${idx}`;
                const pageTitle = item.title || pagePath;
                const viewsCount = Number(item.views) || 0;
                const percentage = Number(item.percentage) || 0;

                return (
                  <div key={`${pagePath}-${idx}`} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-gray-800">{pagePath}</span>
                        {item.title && item.title !== pagePath && (
                          <span className="text-[10px] text-gray-400 font-sans hidden sm:inline">
                            ({item.title})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-extrabold">{viewsCount.toLocaleString()}</span>
                        <span className="text-gray-400 text-[10px]">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#488710] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Visitor Activity by Hour (24h Interactive Chart) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#488710]" />
                <h4 className="text-sm font-extrabold text-gray-900">Visitor Activity by Hour</h4>
              </div>
              <span className="text-[11px] font-bold text-[#488710]">
                {hoveredHour !== null
                  ? `${String(hoveredHour.hour).padStart(2, '0')}:00 - ${hoveredHour.count} visits`
                  : 'Hourly Distribution (00:00 - 23:00)'}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mb-4">
              Peak traffic periods across standard 24-hour day cycle
            </p>
          </div>

          {/* Bar Chart Container */}
          <div className="pt-4">
            <div className="h-36 flex items-end gap-1.5 sm:gap-2 px-1 pb-2 border-b border-gray-100">
              {normalizedHourly.map((count, hour) => {
                const heightPct = hourlyMax > 0 ? (count / hourlyMax) * 100 : 0;
                const isHovered = hoveredHour?.hour === hour;
                return (
                  <div
                    key={`hour-bar-${hour}`}
                    className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    onMouseEnter={() => setHoveredHour({ hour, count })}
                    onMouseLeave={() => setHoveredHour(null)}
                  >
                    <div
                      className={`w-full rounded-t-sm transition-all duration-200 ${
                        isHovered
                          ? 'bg-[#488710] shadow-md shadow-[#488710]/30'
                          : count > 0
                          ? 'bg-[#609f00]/80 hover:bg-[#488710]'
                          : 'bg-gray-100'
                      }`}
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Hour X-Axis Labels */}
            <div className="flex justify-between text-[10px] text-gray-400 font-mono pt-2 px-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
