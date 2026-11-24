import React, { useState } from 'react';
import { Calendar, RefreshCw, Filter, ArrowRight, Clock } from 'lucide-react';

export type DatePeriod =
  | 'today'
  | 'yesterday'
  | '7days'
  | '30days'
  | 'thisWeek'
  | 'thisMonth'
  | 'thisYear'
  | 'custom';

export type ComparisonOption =
  | 'previous_period'
  | 'yesterday'
  | 'last_week'
  | 'last_month'
  | 'none';

interface DateFilterBarProps {
  period: DatePeriod;
  onPeriodChange: (newPeriod: DatePeriod) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomDateChange: (start: string, end: string) => void;
  comparison: ComparisonOption;
  onComparisonChange: (comp: ComparisonOption) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  period,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  comparison,
  onComparisonChange,
  onRefresh,
  isLoading,
}) => {
  const [showCustomInputs, setShowCustomInputs] = useState(period === 'custom');
  const [localStart, setLocalStart] = useState(customStartDate);
  const [localEnd, setLocalEnd] = useState(customEndDate);

  const presets: Array<{ id: DatePeriod; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'thisWeek', label: 'This Week' },
    { id: 'thisMonth', label: 'This Month' },
    { id: 'thisYear', label: 'This Year' },
    { id: 'custom', label: 'Custom' },
  ];

  const handlePresetClick = (pId: DatePeriod) => {
    onPeriodChange(pId);
    if (pId === 'custom') {
      setShowCustomInputs(true);
    } else {
      setShowCustomInputs(false);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (localStart && localEnd) {
      onCustomDateChange(localStart, localEnd);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Section Header & Preset Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500">
            <Filter className="w-4 h-4 text-[#488710]" />
            <span>Time Filter:</span>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            {presets.map((preset) => {
              const isActive = period === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#488710] text-white shadow-xs'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Comparison Dropdown & Refresh Button */}
        <div className="flex items-center flex-wrap gap-3">
          
          {/* Comparison selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-400 font-bold hidden sm:inline-block">Compare:</span>
            <select
              value={comparison}
              onChange={(e) => onComparisonChange(e.target.value as ComparisonOption)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#488710] cursor-pointer"
            >
              <option value="previous_period">Previous Equivalent Period</option>
              <option value="yesterday">Today vs Yesterday</option>
              <option value="last_week">This Week vs Last Week</option>
              <option value="last_month">This Month vs Last Month</option>
              <option value="none">No Comparison</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#f0f9e8] text-[#488710] border border-[#d2ea9d] hover:bg-[#e4f5d6] transition-all cursor-pointer disabled:opacity-50"
            title="Refresh All Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

        </div>

      </div>

      {/* Custom Date Range Picker Bar (if active) */}
      {(showCustomInputs || period === 'custom') && (
        <form
          onSubmit={handleApplyCustom}
          className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Select Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#488710]"
              required
            />
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="date"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#488710]"
              required
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-[#488710] hover:bg-[#3d730e] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Apply Range
          </button>
        </form>
      )}
    </div>
  );
};

