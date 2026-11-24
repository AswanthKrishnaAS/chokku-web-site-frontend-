import React, { useState } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  Search,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
} from 'lucide-react';

export interface OrdersShippingData {
  todayOrders: number;
  yesterdayOrders: number;
  thisWeekOrders: number;
  thisMonthOrders: number;
  totalSales: number;
  totalRevenue: number;
  codOrders: {
    count: number;
    revenue: number;
  };
  onlineOrders: {
    count: number;
    revenue: number;
  };
  statusCounts: Record<string, number>;
  shippingStatusReports: Array<{
    status: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    date: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
  }>;
}

interface OrdersShippingAnalyticsSectionProps {
  data?: OrdersShippingData;
}

export const OrdersShippingAnalyticsSection: React.FC<OrdersShippingAnalyticsSectionProps> = ({
  data = {
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
}) => {
  const [orderSearch, setOrderSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const safeData = data || {
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
  };

  const statusCounts = safeData.statusCounts || {};
  const shippingReports = Array.isArray(safeData.shippingStatusReports) ? safeData.shippingStatusReports : [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const statusIcons: Record<string, any> = {
    Pending: Clock,
    Confirmed: CheckCircle2,
    Processing: Clock,
    Shipped: Truck,
    'Out for Delivery': Truck,
    Delivered: CheckCircle2,
    Cancelled: XCircle,
    Returned: AlertCircle,
  };

  const statusColors: Record<string, string> = {
    Pending: 'bg-orange-50 text-orange-700 border-orange-200',
    Confirmed: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    Processing: 'bg-amber-50 text-amber-700 border-amber-200',
    Shipped: 'bg-blue-50 text-blue-700 border-blue-200',
    'Out for Delivery': 'bg-purple-50 text-purple-700 border-purple-200',
    Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    Returned: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  const recentOrdersList = (Array.isArray(safeData.recentOrders) ? safeData.recentOrders : []).filter((o) => {
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    return (
      (o?.id || '').toLowerCase().includes(q) ||
      (o?.customer || '').toLowerCase().includes(q) ||
      (o?.status || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(recentOrdersList.length / itemsPerPage));
  const paginatedOrders = recentOrdersList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
          <span>Orders & Shipping Analytics</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Fulfillment & Delivery
          </span>
        </h3>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Order volume periods, live shipping pipeline, COD vs Online payments and revenue splits
        </p>
      </div>

      {/* 4 Period Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Today's Orders
          </span>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {Number(safeData.todayOrders) || 0}
          </div>
          <span className="text-[10px] text-gray-400">Current calendar day</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Yesterday's Orders
          </span>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {Number(safeData.yesterdayOrders) || 0}
          </div>
          <span className="text-[10px] text-gray-400">Previous 24 hours</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            This Week's Orders
          </span>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {Number(safeData.thisWeekOrders) || 0}
          </div>
          <span className="text-[10px] text-gray-400">Current active week</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            This Month's Orders
          </span>
          <div className="text-2xl font-black text-[#488710] tracking-tight">
            {Number(safeData.thisMonthOrders) || 0}
          </div>
          <span className="text-[10px] text-gray-400">Month-to-date total</span>
        </div>
      </div>

      {/* Revenue & Payment Breakdown Grid (Total Sales, Revenue, COD, Online) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Total Orders In Range</span>
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">
            {(Number(safeData.totalSales) || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1.5">
            Total verified customer checkouts
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-[#488710]" />
              <span>Total Revenue</span>
            </span>
          </div>
          <div className="text-3xl font-black text-[#488710] tracking-tight">
            {formatCurrency(Number(safeData.totalRevenue) || 0)}
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1.5">
            Gross sales amount from orders
          </p>
        </div>

        {/* COD Orders */}
        <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-amber-600" />
              <span>COD Orders</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              COD
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">
            {Number(safeData.codOrders?.count) || 0}
          </div>
          <p className="text-[11px] text-gray-500 font-bold mt-1.5">
            {formatCurrency(Number(safeData.codOrders?.revenue) || 0)} total value
          </p>
        </div>

        {/* Online Payments */}
        <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Online Payments</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Prepaid
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">
            {Number(safeData.onlineOrders?.count) || 0}
          </div>
          <p className="text-[11px] text-gray-500 font-bold mt-1.5">
            {formatCurrency(Number(safeData.onlineOrders?.revenue) || 0)} total value
          </p>
        </div>
      </div>

      {/* 8 Complete Order Status Pipeline Cards */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#488710]" />
          <span>Fulfillment & Shipping Status Pipeline</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {[
            'Pending',
            'Confirmed',
            'Processing',
            'Shipped',
            'Out for Delivery',
            'Delivered',
            'Cancelled',
            'Returned',
          ].map((status) => {
            const count = Number(statusCounts[status]) || 0;
            const Icon = statusIcons[status] || Clock;
            const badgeClass = statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200';

            return (
              <div
                key={status}
                className="bg-gray-50/70 rounded-xl p-3 border border-gray-200/80 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${badgeClass}`}>
                    {count}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-gray-800 leading-tight truncate">
                    {status}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">Orders</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order-wise Revenue Reports Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-extrabold text-gray-900">Order-wise Revenue & Status Report</h4>
            <p className="text-xs text-gray-400 font-medium">
              Individual orders, payment methods and fulfillment tracking
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search order ID, customer or status..."
              value={orderSearch}
              onChange={(e) => {
                setOrderSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#488710] focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                    No orders found in this period.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord, idx) => (
                  <tr key={ord.id || `order-${idx}`} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {ord.id || `ORD-${idx + 1}`}
                    </td>
                    <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                      {ord.date || '—'}
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-800">
                      {ord.customer || 'Customer'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-semibold text-gray-600 block truncate max-w-[150px]">
                        {ord.paymentMethod || 'COD'}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase">
                        {ord.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          statusColors[ord.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {ord.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-gray-900">
                      {formatCurrency(Number(ord.amount) || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, recentOrdersList.length)} of{' '}
              {recentOrdersList.length} orders
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-gray-700 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
