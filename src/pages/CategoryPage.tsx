import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { PRODUCTS } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { ArrowLeft, Tag, SlidersHorizontal } from 'lucide-react';
import { TreasureCoin } from '../components/TreasureCoin';

export const CategoryPage: React.FC = () => {
  const { category: categorySlug } = useParams<{ category: string }>();
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc'>('popular');

  const currentCategory = CATEGORIES.find((c) => c.slug === categorySlug);

  const categoryProducts = PRODUCTS.filter((p) => p.category === categorySlug).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return b.rating - a.rating;
  });

  if (!currentCategory) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Category Not Found</h2>
        <p className="text-gray-500 mt-2 text-sm">
          The category you requested does not exist or has been moved.
        </p>
        <Link
          to="/shop"
          className="mt-4 inline-flex items-center gap-2 text-brand-green font-bold text-sm hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-16">
      {/* Category Header Hero */}
      <section className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-brand-blue text-white py-12 px-4 sm:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-block px-3 py-1 bg-brand-green text-white text-xs font-extrabold uppercase tracking-wider rounded-full">
                Department
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                {currentCategory.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                {currentCategory.description}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center shrink-0">
              <span className="block text-2xl font-extrabold text-brand-green">
                {categoryProducts.length}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-200">
                Products Available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Sort Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-8">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-green" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {currentCategory.name} Collection
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-blue"
            >
              <option value="popular">Top Rated & Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            No products found in this category yet.
          </div>
        )}

      </div>

      {/* Golden Treasure Coin for Category Page */}
      <TreasureCoin pageId="category" />
    </div>
  );
};
