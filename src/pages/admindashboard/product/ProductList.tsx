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
  ChevronRight
} from 'lucide-react';
import { useProducts } from '../../../context/ProductContext';
import { useCategories } from '../../../context/CategoryContext';
import { useToast } from '../../../context/ToastContext';
import { AdminLayout } from '../Sidebar';

export const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const { products, deleteProduct, refreshProducts, isLoading } = useProducts();
  const { categories } = useCategories();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

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
    </AdminLayout>
  );
};

export default ProductList;
