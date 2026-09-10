import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 block"
    >
      <div className="aspect-16/10 w-full overflow-hidden opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500">
        <img
          src={category.image}
          alt={category.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white">
            {category.itemCount} Products
          </span>
        </div>

        <h3 className="text-xl font-bold text-white group-hover:text-brand-green transition-colors">
          {category.name}
        </h3>

        <p className="text-xs text-gray-200 line-clamp-2 mt-1 mb-3 opacity-90">
          {category.description}
        </p>

        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green group-hover:translate-x-1 transition-transform">
          <span>Explore Collection</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
};
