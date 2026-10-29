import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid, X, Search } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { Filter, FilterState } from '../components/Filter';
import { CATEGORIES } from '../data/categories';
import { useProducts } from '../context/ProductContext';
import { useCategories } from '../context/CategoryContext';
import { TreasureCoin } from '../components/TreasureCoin';

export const Shop: React.FC = () => {
  const { products: storeProducts } = useProducts();
  const { categories: storeCategories } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchCategory = searchParams.get('category') || 'all';
  const searchQueryParam = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(searchQueryParam);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(searchQueryParam);
  }, [searchQueryParam]);

  const allProducts = storeProducts.length > 0 ? storeProducts : PRODUCTS;

  const maxCatalogPrice = useMemo(() => {
    if (allProducts.length === 0) return 5000;
    const maxVal = Math.max(...allProducts.map((p) => p.price || 0));
    return Math.max(1000, Math.ceil(maxVal / 500) * 500);
  }, [allProducts]);

  const [filters, setFilters] = useState<FilterState>({
    category: searchCategory,
    minPrice: 0,
    maxPrice: 100000,
    minRating: 0,
    onlyDiscounted: false,
    sortBy: 'popular',
  });

  useEffect(() => {
    if (searchCategory !== filters.category) {
      setFilters((prev) => ({ ...prev, category: searchCategory }));
    }
  }, [searchCategory]);

  const resetFilters = () => {
    setFilters({
      category: 'all',
      minPrice: 0,
      maxPrice: 100000,
      minRating: 0,
      onlyDiscounted: false,
      sortBy: 'popular',
    });
    setSearchQuery('');
    setSearchParams({});
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Category match
      if (filters.category !== 'all') {
        const catTarget = storeCategories.find((c) => c.slug === filters.category || c.id === filters.category);
        const matchesCategory =
          product.category === filters.category ||
          (product.categoryName || '').toLowerCase() === filters.category.toLowerCase() ||
          (catTarget && (
            product.category === catTarget.slug ||
            product.category === catTarget.id ||
            (product.categoryName || '').toLowerCase() === catTarget.name.toLowerCase()
          ));
        if (!matchesCategory) return false;
      }

      // Price match
      if (product.price < filters.minPrice || product.price > filters.maxPrice) {
        return false;
      }

      // Rating match
      if (filters.minRating > 0 && product.rating < filters.minRating) {
        return false;
      }

      // Discounted match
      if (filters.onlyDiscounted && product.discountPercent === 0) {
        return false;
      }

      // Live Search query match (search by product name, category, keywords, tags, highlights)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchWords = q.split(/\s+/).filter(Boolean);

        const searchableContent = [
          product.name,
          product.categoryName,
          product.category,
          product.description,
          product.discountTag,
          ...(Array.isArray(product.tags) ? product.tags : []),
          ...(Array.isArray(product.highlights) ? product.highlights : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const isExactMatch = searchableContent.includes(q);
        const isAllWordsMatch = searchWords.every((word) => searchableContent.includes(word));
        if (!isExactMatch && !isAllWordsMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;
      if (filters.sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      return b.rating - a.rating; // default 'popular'
    });
  }, [filters, searchQuery, allProducts, storeCategories]);

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <span className="text-xs font-semibold text-brand-green uppercase tracking-wider">
            Catalog Browse
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
            Shop All Products
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Find electronics, fashion apparel, and home essentials with fast express shipping.
          </p>
        </div>

        {/* Main Grid Layout: Sidebar Filter + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Left Filter Sidebar */}
          <Filter
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
            isOpenMobile={isMobileFilterOpen}
            onCloseMobile={() => setIsMobileFilterOpen(false)}
          />

          {/* Right Product Grid Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Control Bar: Results count, Search Input, Sort Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              
              <div className="flex items-center justify-between gap-3">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 shadow-xs"
                >
                  <SlidersHorizontal className="w-4 h-4 text-brand-green" />
                  <span>Filter</span>
                </button>

                <p className="text-xs sm:text-sm text-gray-600">
                  Showing <strong className="text-gray-900 font-bold">{filteredProducts.length}</strong> items
                </p>
              </div>

              {/* Sorting Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="sortBy" className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                  Sort By:
                </label>
                <select
                  id="sortBy"
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value as FilterState['sortBy'],
                    }))
                  }
                  className="bg-white border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-blue"
                >
                  <option value="popular">Popularity & Rating</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

            </div>

            {/* Active Filters Chips */}
            {(filters.category !== 'all' ||
              filters.onlyDiscounted ||
              filters.minRating > 0 ||
              filters.maxPrice < maxCatalogPrice ||
              searchQuery) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-gray-400 font-medium">Active Filters:</span>
                
                {filters.category !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-brand-light-green text-brand-green text-xs font-semibold px-2.5 py-1 rounded-full">
                    Category: {storeCategories.find((c) => c.slug === filters.category || c.id === filters.category)?.name || filters.category}
                    <button onClick={() => setFilters((p) => ({ ...p, category: 'all' }))} className="cursor-pointer">
                      <X className="w-3 h-3 ml-0.5 hover:text-red-500" />
                    </button>
                  </span>
                )}

                {filters.maxPrice < maxCatalogPrice && (
                  <span className="inline-flex items-center gap-1 bg-brand-light-blue text-brand-blue text-xs font-semibold px-2.5 py-1 rounded-full">
                    Max Price: ₹{filters.maxPrice}
                    <button onClick={() => setFilters((p) => ({ ...p, maxPrice: maxCatalogPrice }))} className="cursor-pointer">
                      <X className="w-3 h-3 ml-0.5 hover:text-red-500" />
                    </button>
                  </span>
                )}

                {filters.minRating > 0 && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Rating: {filters.minRating}★+
                    <button onClick={() => setFilters((p) => ({ ...p, minRating: 0 }))} className="cursor-pointer">
                      <X className="w-3 h-3 ml-0.5 hover:text-red-500" />
                    </button>
                  </span>
                )}

                {filters.onlyDiscounted && (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    On Sale Only
                    <button onClick={() => setFilters((p) => ({ ...p, onlyDiscounted: false }))} className="cursor-pointer">
                      <X className="w-3 h-3 ml-0.5 hover:text-red-500" />
                    </button>
                  </span>
                )}

                {searchQuery && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Search: "{searchQuery}"
                    <button onClick={() => { setSearchQuery(''); setSearchParams({}); }} className="cursor-pointer">
                      <X className="w-3 h-3 ml-0.5 hover:text-red-500" />
                    </button>
                  </span>
                )}

                <button
                  onClick={resetFilters}
                  className="text-xs text-red-500 font-semibold hover:underline ml-2 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Product Cards Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              /* Enhanced Empty State for Search & Filters */
              <div className="text-center py-14 px-6 bg-gray-50/80 rounded-3xl border border-dashed border-gray-200 space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-xs border border-gray-100 flex items-center justify-center mx-auto text-gray-400">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>

                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    {searchQuery
                      ? `No products found for "${searchQuery}"`
                      : 'No products match the selected filters'}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {searchQuery
                      ? 'We couldn’t find any catalog items matching your keywords. Check your spelling, try more general terms, or explore popular categories below.'
                      : 'Try broadening your filter criteria or resetting filters to browse all catalog items.'}
                  </p>
                </div>

                {/* Quick Category Suggestions */}
                {storeCategories.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Popular Store Categories
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {storeCategories.slice(0, 6).map((cat) => (
                        <button
                          key={cat.id || cat.slug}
                          onClick={() => {
                            setSearchQuery('');
                            setFilters((p) => ({ ...p, category: cat.slug }));
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-emerald-50 hover:border-[#609f00] text-gray-700 hover:text-[#488710] border border-gray-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 bg-[#609f00] hover:bg-[#528900] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <span>View All Products</span>
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Golden Treasure Coin for Shop Page */}
      <TreasureCoin pageId="shop" />
    </div>
  );
};
