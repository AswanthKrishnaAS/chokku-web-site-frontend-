import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Package,
  Pencil,
  Trash2,
  ArrowLeft,
  Tag,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Shirt,
  Image as ImageIcon
} from 'lucide-react';
import { useProducts } from '../../../context/ProductContext';
import { useToast } from '../../../context/ToastContext';
import { AdminLayout } from '../Sidebar';

export const ProductView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, deleteProduct, isLoading } = useProducts();
  const { addToast } = useToast();

  const product = products.find((p) => p.id === id);

  const gallery = product?.galleryImages && product.galleryImages.length > 0
    ? product.galleryImages
    : product?.image
    ? [product.image]
    : [];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!product || !id) return;
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteProduct(id);
    setIsDeleting(false);

    if (result.success) {
      addToast('Product Deleted', `"${product.name}" has been removed.`, 'success');
      navigate('/admin-dashboard/products');
    } else {
      addToast('Delete Failed', result.message || 'Error deleting product', 'error');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout activeSection="products" title="Product View">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 font-bold text-xs">
          Loading product details...
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout activeSection="products" title="Product View">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto shadow-2xs">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-extrabold text-gray-900">Product Not Found</h2>
          <p className="text-xs text-gray-500 font-medium">
            The requested product details could not be found.
          </p>
          <Link
            to="/admin-dashboard/products"
            className="inline-flex items-center gap-2 bg-[#609f00] text-white font-extrabold px-4 py-2 rounded-xl text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Products Catalog</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  // Calculate savings
  const hasDiscount = product.originalPrice > product.price;
  const savingsAmount = hasDiscount ? product.originalPrice - product.price : 0;
  const savingsPercent = hasDiscount
    ? Math.round((savingsAmount / product.originalPrice) * 100)
    : 0;

  return (
    <AdminLayout activeSection="products" title="Product Details" subtitle={product.name}>
      <div className="space-y-6">

        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <Link to="/admin-dashboard" className="hover:text-[#609f00]">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <Link to="/admin-dashboard/products" className="hover:text-[#609f00]">
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-extrabold truncate max-w-[150px] sm:max-w-xs">
              {product.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin-dashboard/products"
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to List</span>
            </Link>

            <Link
              to={`/admin-dashboard/products/edit/${product.id}`}
              className="px-4 py-2 bg-[#609f00] hover:bg-[#528900] text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Product</span>
            </Link>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Product View Container Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-2xs flex items-center justify-center">
              {gallery.length > 0 ? (
                <img
                  src={gallery[activeImageIndex] || gallery[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center space-y-2 text-gray-400">
                  <Package className="w-16 h-16 mx-auto opacity-40" />
                  <p className="text-xs font-medium">No image available</p>
                </div>
              )}

              {product.discountTag && (
                <div className="absolute top-4 left-4 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{product.discountTag}</span>
                </div>
              )}
            </div>

            {/* Thumbnail Selector */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-[#609f00] ring-2 ring-[#609f00]/30'
                        : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details */}
          <div className="space-y-6">

            {/* Category & Status */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#eaf8dd] text-[#488710] border border-[#d2ea9d] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.categoryName || product.category || 'General'}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                    product.stock > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
                </span>

                {product.tryOn && (
                  <span className="bg-purple-100 text-purple-800 border border-purple-300 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                    <Shirt className="w-3.5 h-3.5" />
                    <span>Try On Enabled</span>
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                {product.name}
              </h1>

              {/* Homepage Placement Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {product.isFeatured && (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Featured Item</span>
                  </span>
                )}
                {product.isNewArrival && (
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <span>✦ New Arrival</span>
                  </span>
                )}
                {product.isBestSeller && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <span>🔥 Best Seller</span>
                  </span>
                )}
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                Store Pricing
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-[#488710]">
                  ₹{product.price}
                </span>

                {hasDiscount && (
                  <>
                    <span className="text-gray-400 line-through text-base font-bold">
                      ₹{product.originalPrice}
                    </span>
                    <span className="text-xs font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded border border-rose-200">
                      SAVE {savingsPercent}% (₹{savingsAmount})
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Virtual Try On Overlay Images Preview */}
            {product.tryOn && (
              <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-purple-600" />
                    <span>Virtual Try On PNG Overlays ({product.tryOnImages?.length || 0})</span>
                  </h3>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                    Active
                  </span>
                </div>

                {product.tryOnImages && product.tryOnImages.length > 0 ? (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {product.tryOnImages.map((src, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-purple-300 bg-slate-900 p-1 shadow-2xs">
                        <img src={src} alt={`Try On ${idx + 1}`} className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-purple-700 font-medium italic">
                    Try On is enabled for this item (no custom PNG overlay files uploaded yet).
                  </p>
                )}

                {/* AR Config Parameters Summary */}
                <div className="pt-3 border-t border-purple-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-600 font-bold">Try-On Type: </span>
                    <span className="font-black text-purple-900 bg-white px-2.5 py-0.5 rounded-lg border border-purple-200 ml-1">
                      {product.tryOnType || 'Earrings'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-bold">Size: </span>
                    <span className="font-black text-purple-900 bg-white px-2.5 py-0.5 rounded-lg border border-purple-200 ml-1">
                      {product.tryOnSize || 'Medium'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                Product Description
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-line">
                {product.description || 'No description provided for this product.'}
              </p>
            </div>

            {/* Technical Specs */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Technical Specifications
                </h3>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden text-xs">
                  {Object.entries(product.specifications).map(([key, val], idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50">
                      <span className="font-bold text-gray-600">{key}</span>
                      <span className="font-semibold text-gray-900">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </AdminLayout>
  );
};

export default ProductView;
