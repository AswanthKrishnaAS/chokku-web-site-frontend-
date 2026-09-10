import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '../components/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-brand-light-green text-brand-green mx-auto flex items-center justify-center font-extrabold text-2xl">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-gray-900">Page Not Found</h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            The page you are looking for doesn't exist, was renamed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>

          <Link to="/shop" className="w-full sm:w-auto">
            <Button variant="outline" size="md" icon={<ShoppingBag className="w-4 h-4" />}>
              Explore Shop
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
