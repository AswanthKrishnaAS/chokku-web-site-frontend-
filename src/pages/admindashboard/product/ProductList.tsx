import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  ArrowLeft,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Star,
  MessageSquare,
  Calendar,
  User,
  X,
  Check,
  Upload,
  Image as ImageIcon,
  Link2,
  CheckSquare,
  Square,
  Download,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useProducts } from '../../../context/ProductContext';
import { useCategories } from '../../../context/CategoryContext';
import { useToast } from '../../../context/ToastContext';
import { AdminLayout } from '../Sidebar';
import { Product, ProductReview } from '../../../types';

export const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const { products, deleteProduct, refreshProducts, addOrUpdateReview, deleteReview, fetchMeeshoReviews, importReviews, isLoading } = useProducts();
  const { categories } = useCategories();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Reviews Management Modal State
  const [selectedProductForReviews, setSelectedProductForReviews] = useState<Product | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [viewingReview, setViewingReview] = useState<ProductReview | null>(null);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  // Review Form Fields
  const [reviewCustomerName, setReviewCustomerName] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDate, setReviewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reviewImage, setReviewImage] = useState<string>('');
  const [isSavingReview, setIsSavingReview] = useState(false);

  // Meesho Review Import State
  const [isMeeshoImportOpen, setIsMeeshoImportOpen] = useState(false);
  const [meeshoUrl, setMeeshoUrl] = useState('');
  const [meeshoFetchCountOption, setMeeshoFetchCountOption] = useState<string>('30');
  const [isFetchingMeeshoReviews, setIsFetchingMeeshoReviews] = useState(false);
  const [fetchedMeeshoReviews, setFetchedMeeshoReviews] = useState<ProductReview[]>([]);
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [isImportingReviews, setIsImportingReviews] = useState(false);
  const [meeshoProductName, setMeeshoProductName] = useState('');

  const handleReviewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('File Too Large', 'Image size must be under 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Keep selected product reference updated
  const currentReviewProduct = selectedProductForReviews
    ? products.find((p) => p.id === selectedProductForReviews.id) || selectedProductForReviews
    : null;

  const handleOpenReviewsModal = (product: Product) => {
    setSelectedProductForReviews(product);
    setIsReviewFormOpen(false);
    setIsMeeshoImportOpen(false);
    setEditingReviewId(null);
    setViewingReview(null);
    setReviewImage('');
    setFetchedMeeshoReviews([]);
    setSelectedReviewIds([]);
  };

  const handleOpenMeeshoImport = () => {
    setIsReviewFormOpen(false);
    setIsMeeshoImportOpen(true);
  };

  const handleFetchMeeshoReviewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeshoUrl.trim()) {
      addToast('URL Required', 'Please paste a valid Meesho product URL', 'error');
      return;
    }
    setIsFetchingMeeshoReviews(true);
    const result = await fetchMeeshoReviews(meeshoUrl.trim(), meeshoFetchCountOption);
    setIsFetchingMeeshoReviews(false);

    if (result.success && result.data && Array.isArray(result.data.reviews)) {
      const revs: ProductReview[] = result.data.reviews;
      setFetchedMeeshoReviews(revs);
      setSelectedReviewIds(revs.map((r) => r.id));
      setMeeshoProductName(result.data.productName || '');
      addToast('Reviews Fetched', `Fetched ${revs.length} reviews from Meesho link`, 'success');
    } else {
      addToast('Fetch Failed', result.message || 'Failed to fetch reviews from Meesho', 'error');
    }
  };

  const handleToggleSelectReview = (id: string) => {
    setSelectedReviewIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllMeeshoReviews = () => {
    if (selectedReviewIds.length === fetchedMeeshoReviews.length) {
      setSelectedReviewIds([]);
    } else {
      setSelectedReviewIds(fetchedMeeshoReviews.map((r) => r.id));
    }
  };

  const handleImportSelectedMeeshoReviews = async () => {
    if (!currentReviewProduct) return;
    if (selectedReviewIds.length === 0) {
      addToast('No Reviews Selected', 'Please select at least one review to import', 'error');
      return;
    }

    const reviewsToImport = fetchedMeeshoReviews.filter((r) => selectedReviewIds.includes(r.id));
    setIsImportingReviews(true);
    const result = await importReviews(currentReviewProduct.id, reviewsToImport);
    setIsImportingReviews(false);

    if (result.success) {
      addToast('Reviews Imported', `Successfully added ${reviewsToImport.length} customer reviews to "${currentReviewProduct.name}"!`, 'success');
      setIsMeeshoImportOpen(false);
      setFetchedMeeshoReviews([]);
      setSelectedReviewIds([]);
      setMeeshoUrl('');
    } else {
      addToast('Import Failed', result.message || 'Failed to import selected reviews', 'error');
    }
  };

  const handleOpenAddReview = () => {
    setEditingReviewId(null);
    setReviewCustomerName('');
    setReviewRating(5);
    setReviewComment('');
    setReviewDate(new Date().toISOString().split('T')[0]);
    setReviewImage('');
    setIsReviewFormOpen(true);
  };

  const handleEditReview = (review: ProductReview) => {
    setEditingReviewId(review.id);
    setReviewCustomerName(review.customerName);
    setReviewRating(review.rating);
    setReviewComment(review.comment);
    setReviewDate(review.date || new Date().toISOString().split('T')[0]);
    setReviewImage(review.image || (review.images && review.images[0]) || '');
    setIsReviewFormOpen(true);
  };

  const handleSaveReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReviewProduct) return;
    if (!reviewCustomerName.trim() || !reviewComment.trim()) {
      addToast('Missing Required Fields', 'Please fill in both Customer Name and Review Comment', 'error');
      return;
    }

    setIsSavingReview(true);
    const result = await addOrUpdateReview(currentReviewProduct.id, {
      id: editingReviewId || undefined,
      customerName: reviewCustomerName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      date: reviewDate,
      image: reviewImage,
      images: reviewImage ? [reviewImage] : [],
    });
    setIsSavingReview(false);

    if (result.success) {
      addToast('Review Saved', 'Customer rating & review updated successfully.', 'success');
      setIsReviewFormOpen(false);
      setEditingReviewId(null);
    } else {
      addToast('Save Failed', result.message || 'Failed to save review', 'error');
    }
  };

  const handleDeleteReviewSubmit = async (reviewId: string) => {
    if (!currentReviewProduct) return;
    if (!window.confirm('Are you sure you want to delete this customer review?')) return;

    const result = await deleteReview(currentReviewProduct.id, reviewId);
    if (result.success) {
      addToast('Review Deleted', 'Customer review removed successfully.', 'info');
    }
  };

  // Filter products based on search term, category, and stock status
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.categoryName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      product.category === selectedCategory ||
      product.categoryName === selectedCategory;

    const matchesStock =
      selectedStockStatus === 'all'
        ? true
        : selectedStockStatus === 'in_stock'
        ? product.stock > 0
        : product.stock <= 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Calculate statistics
  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const featuredCount = products.filter((p) => p.isFeatured).length;

  const handleDelete = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    setIsDeletingId(productId);
    const result = await deleteProduct(productId);
    setIsDeletingId(null);

    if (result.success) {
      addToast('Product Deleted', `"${productName}" was deleted successfully.`, 'success');
    } else {
      addToast('Delete Failed', result.message || 'Failed to delete product', 'error');
    }
  };

  return (
    <AdminLayout activeSection="products" title="Product Catalog Management" subtitle="Manage store inventory">
      <div className="space-y-6">

        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <Link to="/admin-dashboard" className="hover:text-[#609f00]">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-extrabold">Product List</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refreshProducts()}
              disabled={isLoading}
              className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#609f00]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              to="/admin-dashboard/products/add"
              className="px-4 py-2 bg-[#609f00] hover:bg-[#528900] text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </Link>
          </div>
        </div>

        {/* Banner Title */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-[#609f00]" />
            <span>Store Products Catalog ({totalProducts})</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Manage store inventory, update prices, adjust stock levels, and control homepage featured tags.
          </p>
        </div>

        {/* Metric Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-extrabold uppercase tracking-wider">Total Items</span>
              <Package className="w-4 h-4 text-[#609f00]" />
            </div>
            <div className="text-2xl font-black text-gray-900">{totalProducts}</div>
            <p className="text-[11px] text-gray-500 font-medium">In store database</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-extrabold uppercase tracking-wider">In Stock</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{inStockCount}</div>
            <p className="text-[11px] text-gray-500 font-medium">Ready to ship</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-extrabold uppercase tracking-wider">Out of Stock</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-500">{outOfStockCount}</div>
            <p className="text-[11px] text-gray-500 font-medium">Requires restock</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-extrabold uppercase tracking-wider">Featured</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-500">{featuredCount}</div>
            <p className="text-[11px] text-gray-500 font-medium">Homepage items</p>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product name or category..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-[#609f00] focus:bg-white placeholder:text-gray-400 font-medium"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-gray-800 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
              <select
                value={selectedStockStatus}
                onChange={(e) => setSelectedStockStatus(e.target.value)}
                className="bg-transparent text-gray-800 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All Stock Status</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4">
              <Package className="w-10 h-10 text-gray-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-gray-900">No products found</h3>
                <p className="text-xs text-gray-500 font-medium">
                  {searchTerm || selectedCategory !== 'all' || selectedStockStatus !== 'all'
                    ? 'Clear filters or search term to see all catalog items.'
                    : 'Your catalog is empty. Click below to add a new product.'}
                </p>
              </div>
              <Link
                to="/admin-dashboard/products/add"
                className="inline-flex items-center gap-2 bg-[#609f00] hover:bg-[#528900] text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Product</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-extrabold bg-gray-50/50">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Homepage Sections</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0 shadow-2xs">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-gray-900 line-clamp-1">{product.name}</span>
                          {product.discountTag && (
                            <span className="inline-block text-[9px] font-black bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                              {product.discountTag}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600 font-bold">
                        {product.categoryName || product.category || 'General'}
                      </td>

                      <td className="py-3.5 px-4 font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#488710] font-extrabold">₹{product.price}</span>
                          {product.originalPrice > product.price && (
                            <span className="text-gray-400 line-through text-[11px]">₹{product.originalPrice}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            product.stock > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {product.isFeatured && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              ★ Featured
                            </span>
                          )}
                          {product.isNewArrival && (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              ✦ New
                            </span>
                          )}
                          {product.isBestSeller && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              🔥 Best-Seller
                            </span>
                          )}
                          {product.tryOn && (
                            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              👔 Try On
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReviewsModal(product)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Manage Customer Ratings & Reviews"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>Ratings &amp; Reviews ({product.reviewCount || (product.reviews ? product.reviews.length : 0)})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin-dashboard/products/view/${product.id}`)}
                            className="px-2.5 py-1 bg-[#f0f9e8] hover:bg-[#eaf8dd] text-[#488710] border border-[#d2ea9d] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin-dashboard/products/edit/${product.id}`)}
                            className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={isDeletingId === product.id}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Ratings & Reviews Management Modal */}
      {currentReviewProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                  <img src={currentReviewProduct.image} alt={currentReviewProduct.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{currentReviewProduct.rating || 5.0} / 5.0</span>
                    </span>
                    <span className="text-xs text-gray-500 font-semibold">
                      ({currentReviewProduct.reviews ? currentReviewProduct.reviews.length : 0} Reviews)
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 truncate max-w-sm sm:max-w-md mt-0.5">
                    {currentReviewProduct.name}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedProductForReviews(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-5 sm:p-6 space-y-6 flex-1">
              {/* Top Control Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#609f00]" />
                    <span>Customer Ratings &amp; Reviews</span>
                  </h3>
                  <p className="text-xs text-gray-500">View, add, edit, or import customer feedback directly from Meesho links.</p>
                </div>

                {!isReviewFormOpen && !isMeeshoImportOpen && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenMeeshoImport}
                      className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-[#609f00] hover:from-emerald-700 hover:to-[#528900] text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>Import from Meesho</span>
                    </button>

                    <button
                      onClick={handleOpenAddReview}
                      className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Review</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Meesho Review Import UI Section */}
              {isMeeshoImportOpen && (
                <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white border border-emerald-200 rounded-2xl p-5 space-y-5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 rounded-xl text-[#609f00]">
                        <Sparkles className="w-4 h-4 fill-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                          Import Customer Reviews from Meesho Product Link
                        </h4>
                        <p className="text-[11px] text-emerald-700 font-medium">
                          Paste Meesho product link to fetch real customer reviews, ratings, photos, and buyer names.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMeeshoImportOpen(false);
                        setFetchedMeeshoReviews([]);
                      }}
                      className="text-gray-400 hover:text-gray-700 text-xs font-bold p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* URL Input Form */}
                  <form onSubmit={handleFetchMeeshoReviewsSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-[#609f00]" />
                        <span>Meesho Product Link *</span>
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch gap-2">
                        <input
                          type="url"
                          required
                          value={meeshoUrl}
                          onChange={(e) => setMeeshoUrl(e.target.value)}
                          placeholder="Paste Meesho link here (e.g. https://www.meesho.com/s/p/... or https://www.meesho.com/p/...)"
                          className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 focus:border-[#609f00] rounded-xl text-xs font-bold text-gray-900 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="submit"
                          disabled={isFetchingMeeshoReviews}
                          className="px-5 py-2.5 bg-[#609f00] hover:bg-[#528900] text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isFetchingMeeshoReviews ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Fetching Reviews...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              <span>Fetch Reviews</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Fetch Options Buttons (10 reviews, 20 reviews, 30 reviews, fetch all reviews) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-gray-700">Select Review Count Option:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: '10', label: 'Fetch 10 Reviews' },
                          { id: '20', label: 'Fetch 20 Reviews' },
                          { id: '30', label: 'Fetch 30 Reviews' },
                          { id: 'all', label: 'Fetch All Reviews' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setMeeshoFetchCountOption(opt.id)}
                            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                              meeshoFetchCountOption === opt.id
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </form>

                  {/* Display Fetched Reviews List with Manual Selection */}
                  {fetchedMeeshoReviews.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-emerald-200/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-xl border border-emerald-200">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-gray-900 block">
                            Fetched {fetchedMeeshoReviews.length} Reviews {meeshoProductName ? `for "${meeshoProductName}"` : ''}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 block">
                            {selectedReviewIds.length} of {fetchedMeeshoReviews.length} selected for import
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSelectAllMeeshoReviews}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-extrabold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {selectedReviewIds.length === fetchedMeeshoReviews.length ? (
                              <>
                                <Square className="w-3.5 h-3.5 text-gray-500" />
                                <span>Deselect All</span>
                              </>
                            ) : (
                              <>
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Select All ({fetchedMeeshoReviews.length})</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleImportSelectedMeeshoReviews}
                            disabled={isImportingReviews || selectedReviewIds.length === 0}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isImportingReviews ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                            <span>Import {selectedReviewIds.length} Reviews</span>
                          </button>
                        </div>
                      </div>

                      {/* Scrollable list of selectable reviews */}
                      <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                        {fetchedMeeshoReviews.map((rev) => {
                          const isSelected = selectedReviewIds.includes(rev.id);
                          return (
                            <div
                              key={rev.id}
                              onClick={() => handleToggleSelectReview(rev.id)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                                isSelected
                                  ? 'bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-400'
                                  : 'bg-white/60 border-gray-200 hover:border-gray-300 opacity-75'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by parent container click
                                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />

                              <div className="flex-1 space-y-1 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold text-gray-900 flex items-center gap-2">
                                    {rev.profileImage ? (
                                      <img
                                        src={rev.profileImage}
                                        alt={rev.customerName}
                                        referrerPolicy="no-referrer"
                                        className="w-6 h-6 rounded-full object-cover border border-emerald-300 shadow-2xs"
                                      />
                                    ) : (
                                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#488710] flex items-center justify-center font-black text-[10px]">
                                        {rev.customerName.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                    <span>{rev.customerName}</span>
                                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      Verified Buyer
                                    </span>
                                  </span>

                                  <div className="flex items-center gap-1 text-amber-500 font-extrabold text-[11px]">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                                    <span>{rev.rating}.0</span>
                                    <span className="text-gray-400 font-semibold ml-2">{rev.date}</span>
                                  </div>
                                </div>

                                <p className="text-gray-800 font-medium leading-relaxed">
                                  "{rev.comment}"
                                </p>

                                {(rev.image || (rev.images && rev.images.length > 0)) && (
                                  <div className="pt-1 flex items-center gap-2">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                                      <img
                                        src={rev.image || (rev.images && rev.images[0])}
                                        alt="Review attachment"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500">Customer photo attached</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Add / Edit Review Form */}
              {isReviewFormOpen && (
                <form onSubmit={handleSaveReviewSubmit} className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <span>{editingReviewId ? 'Edit Customer Review' : 'Add New Customer Review'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="text-gray-400 hover:text-gray-700 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Customer Name */}
                    <div>
                      <label className="block font-extrabold text-gray-700 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        required
                        value={reviewCustomerName}
                        onChange={(e) => setReviewCustomerName(e.target.value)}
                        placeholder="e.g. Priya Sharma, Alex M."
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-bold text-gray-900"
                      />
                    </div>

                    {/* Review Date */}
                    <div>
                      <label className="block font-extrabold text-gray-700 mb-1">Review Date *</label>
                      <input
                        type="date"
                        required
                        value={reviewDate}
                        onChange={(e) => setReviewDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-bold text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Star Rating Picker */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-700">Star Rating * ({reviewRating} / 5 Stars)</label>
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200 w-fit">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-115"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= reviewRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-200 fill-gray-100'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-black text-amber-600 ml-2">{reviewRating}.0 Stars</span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="text-xs">
                    <label className="block font-extrabold text-gray-700 mb-1">Review / Comment *</label>
                    <textarea
                      rows={3}
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write customer feedback or review comment here..."
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-medium text-gray-800"
                    />
                  </div>

                  {/* Customer Review Image Field */}
                  <div className="text-xs space-y-2">
                    <label className="block font-extrabold text-gray-700">Customer Review Image / Photo (Optional)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div className="relative border-2 border-dashed border-gray-300 hover:border-[#609f00] rounded-xl p-2.5 bg-white transition-colors text-center cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReviewImageUpload}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <div className="flex items-center justify-center gap-2 text-gray-600 font-bold text-xs">
                          <Upload className="w-4 h-4 text-[#609f00]" />
                          <span>Choose Image File...</span>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={reviewImage}
                          onChange={(e) => setReviewImage(e.target.value)}
                          placeholder="Or paste image URL (https://...)"
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#609f00] font-medium text-gray-800 text-xs"
                        />
                      </div>
                    </div>

                    {reviewImage && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-amber-300 bg-white shadow-2xs">
                          <img src={reviewImage} alt="Review preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-gray-600 block">Image attached</span>
                          <button
                            type="button"
                            onClick={() => setReviewImage('')}
                            className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingReview}
                      className="bg-[#609f00] hover:bg-[#528900] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{isSavingReview ? 'Saving...' : editingReviewId ? 'Update Review' : 'Save Review'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              {!currentReviewProduct.reviews || currentReviewProduct.reviews.length === 0 ? (
                <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-3">
                  <MessageSquare className="w-10 h-10 text-gray-400 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-gray-900">No Reviews Yet</h4>
                    <p className="text-xs text-gray-500">There are no customer ratings or comments for this product yet.</p>
                  </div>
                  {!isReviewFormOpen && (
                    <button
                      onClick={handleOpenAddReview}
                      className="inline-flex items-center gap-1.5 bg-[#609f00] hover:bg-[#528900] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add First Review</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {currentReviewProduct.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-4 shadow-2xs space-y-2 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          {rev.profileImage ? (
                            <img
                              src={rev.profileImage}
                              alt={rev.customerName}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover border border-emerald-400 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#488710] flex items-center justify-center font-black text-xs shrink-0">
                              {rev.customerName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-black text-gray-900 flex items-center gap-2">
                              <span>{rev.customerName}</span>
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                              <div className="flex text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${
                                      i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span>({rev.rating}.0)</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{rev.date}</span>
                          </span>

                          {/* Review Item Actions: View, Edit, Delete */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingReview(rev)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-extrabold transition-colors flex items-center gap-1 cursor-pointer"
                              title="View Full Review"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEditReview(rev)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-extrabold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Edit Review"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteReviewSubmit(rev.id)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-extrabold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Delete Review"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-700 font-medium leading-relaxed pt-1">
                        "{rev.comment}"
                      </p>

                      {/* Review Image Attachment */}
                      {(rev.image || (rev.images && rev.images.length > 0)) && (
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingReview(rev)}
                            className="group relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer hover:border-[#609f00] transition-colors"
                            title="Click to view image"
                          >
                            <img
                              src={rev.image || (rev.images && rev.images[0])}
                              alt="Customer review attachment"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex items-center justify-between text-xs text-gray-500 font-bold">
              <span>Total Reviews: {currentReviewProduct.reviews ? currentReviewProduct.reviews.length : 0}</span>
              <button
                onClick={() => setSelectedProductForReviews(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-extrabold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Review Details Modal */}
      {viewingReview && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                {viewingReview.profileImage ? (
                  <img
                    src={viewingReview.profileImage}
                    alt={viewingReview.customerName}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border-2 border-emerald-400 shadow-2xs"
                  />
                ) : (
                  <User className="w-5 h-5 text-[#609f00]" />
                )}
                <h3 className="text-sm font-extrabold text-gray-900">{viewingReview.customerName}</h3>
              </div>
              <button onClick={() => setViewingReview(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-500">Star Rating:</span>
                <div className="flex text-amber-400 items-center gap-1 font-extrabold text-amber-600">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < viewingReview.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'
                      }`}
                    />
                  ))}
                  <span>({viewingReview.rating}.0 Stars)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-500">Review Date:</span>
                <span className="font-bold text-gray-800">{viewingReview.date}</span>
              </div>

              <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <span className="font-extrabold text-gray-700 block">Customer Feedback:</span>
                <p className="text-gray-800 leading-relaxed font-medium">"{viewingReview.comment}"</p>
              </div>

              {/* View Attached Image */}
              {(viewingReview.image || (viewingReview.images && viewingReview.images.length > 0)) && (
                <div className="space-y-1.5 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <span className="font-extrabold text-gray-700 block flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#609f00]" />
                    <span>Customer Photo Attachment:</span>
                  </span>
                  <div className="w-full max-h-56 rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center p-1">
                    <img
                      src={viewingReview.image || (viewingReview.images && viewingReview.images[0])}
                      alt="Customer review attachment"
                      className="w-full h-full object-contain max-h-52 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingReview(null)}
                className="px-4 py-2 bg-[#609f00] text-white font-extrabold text-xs rounded-xl hover:bg-[#528900]"
              >
                Close Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ProductList;
