import React from 'react';
import { Filter as FilterIcon, X, RotateCcw, Star } from 'lucide-react';
import { CATEGORIES } from '../data/categories';

export interface FilterState {
  category: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  onlyDiscounted: boolean;
  sortBy: 'popular' | 'newest' | 'price-asc' | 'price-desc';
}

interface FilterProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Filter: React.FC<FilterProps> = ({
  filters,
  setFilters,
  resetFilters,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const handleCategoryChange = (slug: string) => {
    setFilters((prev) => ({ ...prev, category: slug }));
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-brand-blue" />
          <h3 className="font-bold text-gray-900 text-base">Filter Products</h3>
        </div>

        <button
          onClick={resetFilters}
          className="text-xs font-semibold text-brand-green hover:underline inline-flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Categories</h4>
        <div className="space-y-2">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.category === 'all'
                ? 'bg-brand-light-green text-brand-green border-l-4 border-brand-green'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Products
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                filters.category === cat.slug
                  ? 'bg-brand-light-green text-brand-green border-l-4 border-brand-green'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {cat.itemCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900">Price Range</h4>
          <span className="text-xs font-bold text-brand-green">
            ₹{filters.minPrice} - ₹{filters.maxPrice}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="300"
          step="10"
          value={filters.maxPrice}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))
          }
          className="w-full accent-brand-green cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>₹0</span>
          <span>₹300</span>
        </div>
      </div>

      {/* Minimum Rating Filter */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Minimum Rating</h4>
        <div className="space-y-1.5">
          {[4, 3, 2].map((stars) => (
            <button
              key={stars}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  minRating: prev.minRating === stars ? 0 : stars,
                }))
              }
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filters.minRating === stars
                  ? 'bg-brand-light-blue text-brand-blue border border-brand-blue/30'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
                <span className="text-gray-700 ml-1 font-semibold">{stars}★ & above</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Special Deals Checkbox */}
      <div className="pt-2 border-t border-gray-100">
        <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-gray-800">
          <input
            type="checkbox"
            checked={filters.onlyDiscounted}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, onlyDiscounted: e.target.checked }))
            }
            className="w-4 h-4 rounded text-brand-green focus:ring-brand-green accent-brand-green cursor-pointer"
          />
          <span>Discounted Items Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block bg-white p-5 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
        {content}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-full max-w-xs bg-white h-full p-6 shadow-2xl overflow-y-auto ml-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b">
                <h3 className="font-bold text-gray-900">Filters</h3>
                <button
                  onClick={onCloseMobile}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {content}
            </div>

            <button
              onClick={onCloseMobile}
              className="mt-6 w-full bg-brand-green text-white py-3 rounded-xl font-semibold hover:bg-brand-green-hover transition-colors shadow"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
};
