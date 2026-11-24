import React, { useState, useMemo } from 'react';
import { Package, Eye, ShoppingCart, CheckCircle2, Heart, Search, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export interface ProductStatItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  stock?: number;
  views: number;
  cartAdditions: number;
  purchases: number;
  wishlisted: number;
  conversionRate: number;
  revenue: number;
}

interface ProductAnalyticsSectionProps {
  allProducts?: ProductStatItem[];
  mostViewed?: ProductStatItem[];
  mostAddedToCart?: ProductStatItem[];
  mostPurchased?: ProductStatItem[];
  mostWishlisted?: ProductStatItem[];
}

export const ProductAnalyticsSection: React.FC<ProductAnalyticsSectionProps> = ({
  allProducts = [],
  mostViewed = [],
  mostAddedToCart = [],
  mostPurchased = [],
  mostWishlisted = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'views' | 'cart' | 'purchases' | 'wishlist'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const safeAll = Array.isArray(allProducts) ? allProducts : [];
  const safeViewed = Array.isArray(mostViewed) ? mostViewed : [];
  const safeCart = Array.isArray(mostAddedToCart) ? mostAddedToCart : [];
  const safePurchased = Array.isArray(mostPurchased) ? mostPurchased : [];
  const safeWishlisted = Array.isArray(mostWishlisted) ? mostWishlisted : [];

  // Defensive field extraction helpers
  const cleanText = (str?: string) => {
    if (!str) return 'Product';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, '/');
  };
  const getViews = (p: any) => Number(p?.views) || 0;
  const getCartAdds = (p: any) => Number(p?.cartAdditions ?? p?.cartAdds) || 0;
  const getPurchases = (p: any) => Number(p?.purchases) || 0;
  const getWishlists = (p: any) => Number(p?.wishlisted ?? p?.wishlists) || 0;
  const getRevenue = (p: any) => Number(p?.revenue ?? (p?.price ? p.price * (p.purchases || 0) : 0)) || 0;
  const getConversionRate = (p: any) => {
    if (typeof p?.conversionRate === 'number') return p.conversionRate;
    if (typeof p?.conversionRate === 'string') return parseFloat(p.conversionRate) || 0;
    const v = getViews(p);
    const pur = getPurchases(p);
    return v > 0 ? Math.min(100, Math.round((pur / v) * 1000) / 10) : 0;
  };

  const filteredProducts = useMemo(() => {
    let list = [...safeAll];
    if (activeTab === 'views') list.sort((a, b) => getViews(b) - getViews(a));
    else if (activeTab === 'cart') list.sort((a, b) => getCartAdds(b) - getCartAdds(a));
    else if (activeTab === 'purchases') list.sort((a, b) => getPurchases(b) - getPurchases(a));
    else if (activeTab === 'wishlist') list.sort((a, b) => getWishlists(b) - getWishlists(a));

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          (p?.name || '').toLowerCase().includes(q) ||
          (p?.category || '').toLowerCase().includes(q) ||
          (p?.id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [safeAll, activeTab, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
          <span>Product Analytics & Performance</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Catalog Intelligence
          </span>
        </h3>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Detailed product engagement, view-to-cart conversion, and sales volume per item
        </p>
      </div>

      {/* 4 Highlight Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Most Viewed Product */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Most Viewed</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Top #1
            </span>
          </div>
          {safeViewed[0] ? (
            <div className="flex items-center gap-3 mt-1">
              <img
                src={safeViewed[0].image || '/placeholder.png'}
                alt={safeViewed[0].name || 'Product'}
                className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{cleanText(safeViewed[0].name)}</p>
                <p className="text-xs font-black text-blue-600 mt-0.5">
                  {getViews(safeViewed[0]).toLocaleString()} views
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">No product views recorded</p>
          )}
        </div>

        {/* Most Added to Cart Product */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              <span>Most Cart Adds</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Top #1
            </span>
          </div>
          {safeCart[0] ? (
            <div className="flex items-center gap-3 mt-1">
              <img
                src={safeCart[0].image || '/placeholder.png'}
                alt={safeCart[0].name || 'Product'}
                className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{cleanText(safeCart[0].name)}</p>
                <p className="text-xs font-black text-emerald-600 mt-0.5">
                  {getCartAdds(safeCart[0]).toLocaleString()} cart adds
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">No cart adds recorded</p>
          )}
        </div>

        {/* Most Purchased Product */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#488710]" />
              <span>Most Purchased</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f9e8] text-[#488710]">
              Top #1
            </span>
          </div>
          {safePurchased[0] ? (
            <div className="flex items-center gap-3 mt-1">
              <img
                src={safePurchased[0].image || '/placeholder.png'}
                alt={safePurchased[0].name || 'Product'}
                className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{cleanText(safePurchased[0].name)}</p>
                <p className="text-xs font-black text-[#488710] mt-0.5">
                  {getPurchases(safePurchased[0]).toLocaleString()} units sold
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">No orders recorded</p>
          )}
        </div>

        {/* Most Wishlisted Product */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-600" />
              <span>Most Wishlisted</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
              Top #1
            </span>
          </div>
          {safeWishlisted[0] ? (
            <div className="flex items-center gap-3 mt-1">
              <img
                src={safeWishlisted[0].image || '/placeholder.png'}
                alt={safeWishlisted[0].name || 'Product'}
                className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{cleanText(safeWishlisted[0].name)}</p>
                <p className="text-xs font-black text-rose-600 mt-0.5">
                  {getWishlists(safeWishlisted[0]).toLocaleString()} saves
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">No wishlist saves</p>
          )}
        </div>

      </div>

      {/* Comprehensive Product Performance Table with Filter & Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Quick Sort Tabs */}
          <div className="flex items-center flex-wrap gap-1 w-full sm:w-auto">
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Products ({filteredProducts.length})
            </button>
            <button
              onClick={() => { setActiveTab('views'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'views'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              By Views
            </button>
            <button
              onClick={() => { setActiveTab('cart'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'cart'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              By Cart Adds
            </button>
            <button
              onClick={() => { setActiveTab('purchases'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'purchases'
                  ? 'bg-[#488710] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              By Purchases
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search product name or id..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#488710] focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          </div>

        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3 text-center">Views</th>
                <th className="py-3 px-3 text-center">Cart Adds</th>
                <th className="py-3 px-3 text-center">Purchases</th>
                <th className="py-3 px-3 text-center">Conversion</th>
                <th className="py-3 px-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-gray-400">
                    No matching products found.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  const views = getViews(p);
                  const cartAdds = getCartAdds(p);
                  const purchases = getPurchases(p);
                  const convRate = getConversionRate(p);
                  const revenue = getRevenue(p);

                  return (
                    <tr key={p.id || `prod-${idx}`} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <img
                            src={p.image || '/placeholder.png'}
                            alt={p.name || 'Product'}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{cleanText(p.name)}</p>
                            <p className="text-[10px] text-gray-400">{p.category || 'General'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-800">
                        {formatCurrency(p.price || 0)}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-600">
                        {views.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">
                        {cartAdds.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[#488710]">
                        {purchases.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            convRate >= 10
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : convRate > 0
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {convRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-gray-900">
                        {formatCurrency(revenue)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{' '}
              {filteredProducts.length} items
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
