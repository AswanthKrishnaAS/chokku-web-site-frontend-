import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { Product } from '../types';

export const SearchBar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length > 1) {
      const q = query.toLowerCase();
      const matches = PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      ).slice(0, 5);
      setSuggestions(matches);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/product/${product.id}`);
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, brands, categories..."
          className="w-full py-2 pl-10 pr-10 text-sm text-gray-800 bg-gray-50/80 border border-gray-200/80 rounded-full focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
        />
        <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />

        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-12 text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="submit"
          className="absolute right-1 bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-full transition-colors shadow-xs"
          title="Search"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Real-time Search Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden divide-y divide-gray-50">
          {suggestions.length > 0 ? (
            <div>
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Products Found
              </div>
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-emerald-50/80 transition-colors text-left group"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-emerald-700 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">{product.categoryName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-emerald-600">
                      ₹{product.price.toFixed(2)}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="block text-xs text-gray-400 line-through">
                        ₹{product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              ))}

              <button
                onClick={handleSearchSubmit}
                className="w-full px-4 py-2.5 text-center text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View all results for "{query}"</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No products found matching "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
