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

  const [filters, setFilters] = useState<FilterState>({
    category: searchCategory,
    minPrice: 0,
    maxPrice: 300,
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
      maxPrice: 300,
      minRating: 0,
      onlyDiscounted: false,
      sortBy: 'popular',
    });
    setSearchQuery('');
    setSearchParams({});
  };

  // Filter & Sort Logic
  const allProducts = storeProducts.length > 0 ? storeProducts : PRODUCTS;
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Category match
      if (filters.category !== 'all' && product.category !== filters.category) {
        return false;
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
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = product.name.toLowerCase().includes(q);
        const matchesCategory = product.categoryName.toLowerCase().includes(q);
        const matchesTags = product.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCategory && !matchesTags) {
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
  }, [filters, searchQuery, allProducts]);

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
              filters.maxPrice < 300 ||
              searchQuery) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-gray-400 font-medium">Active Filters:</span>
                
                {filters.category !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-brand-light-green text-brand-green text-xs font-semibold px-2.5 py-1 rounded-full">
                    Category: {CATEGORIES.find((c) => c.slug === filters.category)?.name || filters.category}
                    <button onClick={() => setFilters((p) => ({ ...p, category: 'all' }))}>
                      <X className="w-3 h-3 ml-0.5 hover:text-red-500" />
                    </button>
                  </span>
                )}

                {filters.maxPrice < 300 && (
                  <span className="inline-flex items-center gap-1 bg-brand-light-blue text-brand-blue text-xs font-semibold px-2.5 py-1 rounded-full">
                    Max Price: ₹{filters.maxPrice}
                    <button onClick={() => setFilters((p) => ({ ...p, maxPrice: 300 }))}>
                      <X className="w-3 h-3 ml-0.5 hover:text-red-500" />
                    </button>
                  </span>
                )}

                {filters.minRating > 0 && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Rating: {filters.minRating}★+
                    <button onClick={() => setFilters((p) => ({ ...p, minRating: 0 }))}>
                      <X className="w-3 h-3 ml-0.5 hover:text-red-500" />
                    </button>
                  </span>
                )}

                {filters.onlyDiscounted && (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    On Sale Only
                    <button onClick={() => setFilters((p) => ({ ...p, onlyDiscounted: false }))}>
                      <X className="w-3 h-3 ml-0.5 hover:text-red-500" />
                    </button>
                  </span>
                )}

                {searchQuery && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}>
                      <X className="w-3 h-3 ml-0.5 hover:text-red-500" />
                    </button>
                  </span>
                )}

                <button
                  onClick={resetFilters}
                  className="text-xs text-red-500 font-semibold hover:underline ml-2"
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
              /* Empty State */
              <div className="text-center py-16 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-800">No products match your criteria</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  Try adjusting your search query, clearing specific price/rating filters, or browsing other category sections.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center gap-2 bg-brand-green text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-green-hover transition-colors shadow-xs"
                >
                  Reset All Filters
                </button>
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
