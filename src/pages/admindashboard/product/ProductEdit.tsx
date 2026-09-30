import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Package,
  Pencil,
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Check,
  Tag,
  Trash2,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Plus,
  Info,
  Shirt
} from 'lucide-react';
import { useProducts } from '../../../context/ProductContext';
import { useCategories } from '../../../context/CategoryContext';
import { useToast } from '../../../context/ToastContext';
import { AdminLayout } from '../Sidebar';

interface SpecRow {
  key: string;
  value: string;
}

export const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addProductOrUpdate, uploadProductImages, uploadTryOnImages, isLoading } = useProducts();
  const { categories } = useCategories();
  const { addToast } = useToast();

  const targetProduct = products.find((p) => p.id === id);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [discountTag, setDiscountTag] = useState('');
  const [description, setDescription] = useState('');
  
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Try On state
  const [tryOn, setTryOn] = useState(false);
  const [tryOnFiles, setTryOnFiles] = useState<File[]>([]);
  const [tryOnPreviews, setTryOnPreviews] = useState<string[]>([]);
  const [tryOnType, setTryOnType] = useState<'Earrings' | 'Necklace' | 'Dress' | 'Bangle' | 'Shoes' | 'Glasses' | 'Other'>('Earrings');
  const [tryOnSize, setTryOnSize] = useState<'Small' | 'Medium' | 'Large'>('Medium');

  const [specs, setSpecs] = useState<SpecRow[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing product data
  useEffect(() => {
    if (targetProduct) {
      setName(targetProduct.name || '');
      setCategory(targetProduct.category || categories[0]?.slug || 'general');
      setSellingPrice(targetProduct.price !== undefined ? targetProduct.price.toString() : '0');
      setOriginalPrice(
        targetProduct.originalPrice !== undefined
          ? targetProduct.originalPrice.toString()
          : targetProduct.price
          ? targetProduct.price.toString()
          : '0'
      );
      setStock(targetProduct.stock !== undefined ? targetProduct.stock.toString() : '0');
      setDiscountTag(targetProduct.discountTag || '');
      setDescription(targetProduct.description || '');

      setIsFeatured(Boolean(targetProduct.isFeatured));
      setIsNewArrival(Boolean(targetProduct.isNewArrival));
      setIsBestSeller(Boolean(targetProduct.isBestSeller));

      // Try On
      setTryOn(Boolean(targetProduct.tryOn));
      setTryOnPreviews(Array.isArray(targetProduct.tryOnImages) ? targetProduct.tryOnImages : []);
      setTryOnType(targetProduct.tryOnType || 'Earrings');
      const scaleVal = targetProduct.tryOnScale ?? 1.0;
      setTryOnSize(targetProduct.tryOnSize || (scaleVal < 0.85 ? 'Small' : scaleVal > 1.2 ? 'Large' : 'Medium'));

      // Catalog Image previews
      const initialPreviews =
        targetProduct.galleryImages && targetProduct.galleryImages.length > 0
          ? targetProduct.galleryImages
          : targetProduct.image
          ? [targetProduct.image]
          : [];
      setPreviews(initialPreviews);

      // Specifications
      if (targetProduct.specifications && typeof targetProduct.specifications === 'object') {
        const specList = Object.entries(targetProduct.specifications).map(([key, value]) => ({ key, value }));
        setSpecs(specList.length > 0 ? specList : [{ key: 'Brand', value: '' }]);
      } else {
        setSpecs([{ key: 'Brand', value: '' }]);
      }
    }
  }, [targetProduct, id, categories]);

  // Handle standard catalog images
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);

      const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Try On PNG images
  const handleTryOnFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const pngFiles = selectedFiles.filter(
        (file) => file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
      );

      if (pngFiles.length !== selectedFiles.length) {
        addToast('Invalid Format', 'Only PNG images (.png) are allowed for Try On!', 'error');
      }

      if (pngFiles.length === 0) return;

      setTryOnFiles((prev) => {
        const combined = [...prev, ...pngFiles];
        if (combined.length > 5) {
          addToast('Limit Exceeded', 'Maximum 5 Try On PNG images allowed.', 'warning');
        }
        return combined.slice(0, 5);
      });

      const newPreviews = pngFiles.map((file) => URL.createObjectURL(file));
      setTryOnPreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
    }
  };

  const handleRemoveTryOnImage = (index: number) => {
    setTryOnFiles((prev) => prev.filter((_, i) => i !== index));
    setTryOnPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Specs handlers
  const handleAddSpecRow = () => {
    setSpecs((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    setSpecs((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Edit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (!name.trim()) {
      addToast('Validation Error', 'Product Name is required', 'error');
      return;
    }
    if (!sellingPrice || Number(sellingPrice) < 0) {
      addToast('Validation Error', 'Please enter a valid Selling Price', 'error');
      return;
    }

    if (tryOn && tryOnFiles.length === 0 && tryOnPreviews.length === 0) {
      addToast('Mandatory Field Required', 'Try On is enabled. Please upload at least 1 PNG image for Try On, or uncheck the Try On option.', 'error');
      return;
    }

    setIsSubmitting(true);
    let finalGalleryImages: string[] = [...previews];
    let finalTryOnImages: string[] = tryOn ? [...tryOnPreviews] : [];

    // Upload newly added standard catalog files
    if (files.length > 0) {
      const uploadRes = await uploadProductImages(files);
      if (uploadRes.success && Array.isArray(uploadRes.imageUrls) && uploadRes.imageUrls.length > 0) {
        finalGalleryImages = [...finalGalleryImages, ...uploadRes.imageUrls];
      }
    }

    // Upload newly added Try On PNG files if enabled
    if (tryOn && tryOnFiles.length > 0) {
      const tryOnRes = await uploadTryOnImages(tryOnFiles);
      if (tryOnRes.success && Array.isArray(tryOnRes.imageUrls) && tryOnRes.imageUrls.length > 0) {
        finalTryOnImages = [...finalTryOnImages, ...tryOnRes.imageUrls];
      }
    }

    // Build specs object
    const specMap: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim()) {
        specMap[s.key.trim()] = s.value.trim();
      }
    });

    const categoryObj = categories.find((c) => c.slug === category);
    const categoryName = categoryObj ? categoryObj.name : 'General';

    const result = await addProductOrUpdate({
      id,
      name: name.trim(),
      category: category || 'general',
      categoryName,
      price: Number(sellingPrice) || 0,
      originalPrice: Number(originalPrice) || Number(sellingPrice) || 0,
      discountTag: discountTag.trim(),
      description: description.trim(),
      stock: Number(stock) || 0,
      specifications: specMap,
      image: finalGalleryImages[0] || '',
      galleryImages: finalGalleryImages,
      isFeatured,
      isNewArrival,
      isBestSeller,
      tryOn,
      tryOnImages: tryOn ? finalTryOnImages : [],
      tryOnType,
      tryOnSize,
      tryOnScale: tryOnSize === 'Small' ? 0.75 : tryOnSize === 'Large' ? 1.35 : 1.0,
    });

    setIsSubmitting(false);

    if (result.success) {
      addToast('Product Updated!', `"${name}" changes saved successfully.`, 'success');
      navigate('/admin-dashboard/products');
    } else {
      addToast('Update Failed', result.message || 'Failed to update product', 'error');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout activeSection="products" title="Edit Product">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 font-bold text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#609f00]" />
          <span>Loading product details...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!targetProduct) {
    return (
      <AdminLayout activeSection="products" title="Edit Product">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto shadow-2xs">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-extrabold text-gray-900">Product Not Found</h2>
          <p className="text-xs text-gray-500 font-medium">
            The product you are trying to edit does not exist or has been deleted.
          </p>
          <Link
            to="/admin-dashboard/products"
            className="inline-flex items-center gap-2 bg-[#609f00] text-white font-extrabold px-4 py-2 rounded-xl text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Product List</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeSection="products" title="Edit Product" subtitle={`Editing ${targetProduct.name}`}>
      <div className="space-y-6">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <Link to="/admin-dashboard" className="hover:text-[#609f00]">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <Link to="/admin-dashboard/products" className="hover:text-[#609f00]">
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-extrabold">Edit Product</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/admin-dashboard/products/view/${id}`}
              className="px-3 py-1.5 bg-[#f0f9e8] text-[#488710] rounded-xl text-xs font-bold border border-[#d2ea9d]"
            >
              View Details
            </Link>
            <Link
              to="/admin-dashboard/products"
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </Link>
          </div>
        </div>

        {/* Title Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Pencil className="w-6 h-6 text-[#609f00]" />
            <span>Edit Product: {targetProduct.name}</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Update product details, pricing, Try On PNG overlays, and specifications.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#488710] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Info className="w-4 h-4" />
              <span>Basic Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white font-medium cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id || cat.slug} value={cat.slug}>
                      {cat.name} ({cat.slug})
                    </option>
                  ))}
                  {categories.length === 0 && (
                    <option value="electronics">Electronics</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">
                  Discount Tag / Offer Badge
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={discountTag}
                    onChange={(e) => setDiscountTag(e.target.value)}
                    placeholder="e.g. SAVE 20%"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white font-medium"
                  />
                  <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">
                  Product Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#488710] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Package className="w-4 h-4" />
              <span>Pricing & Inventory</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">
                  Selling Price (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">
                  Original / MRP Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">
                  Stock Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Standard Product Images */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#488710] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Upload className="w-4 h-4" />
              <span>Image Gallery</span>
            </h2>

            <div className="space-y-3 pt-1">
              <div className="border-2 border-dashed border-gray-300 hover:border-[#609f00] bg-gray-50/70 hover:bg-[#f0f9e8]/30 rounded-2xl p-6 text-center transition-all">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="product-edit-images-input"
                />
                <label htmlFor="product-edit-images-input" className="cursor-pointer space-y-2 block">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto text-[#609f00] shadow-2xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-extrabold text-gray-900">
                    Add or replace product image files
                  </div>
                </label>
              </div>

              {previews.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-gray-700 mb-2">Current Image Gallery:</div>
                  <div className="flex flex-wrap gap-3">
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-white group shadow-2xs">
                        <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full text-xs shadow-md hover:bg-rose-600 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Virtual Try On Feature Settings */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Shirt className="w-4 h-4 text-purple-600" />
              <span>Virtual Try On Settings</span>
            </h2>

            <div className="space-y-4 pt-1">
              <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                tryOn ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-2xs' : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}>
                <input
                  type="checkbox"
                  checked={tryOn}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setTryOn(checked);
                    if (!checked) {
                      setTryOnFiles([]);
                      setTryOnPreviews([]);
                    }
                  }}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-black">Enable "Try On" for this product</div>
                  <div className="text-[10px] text-gray-500 font-medium">
                    Allows customers to virtually preview PNG overlay images of this item.
                  </div>
                </div>
              </label>

              {tryOn && (
                <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-purple-900">
                      Try On PNG Overlay Images <span className="text-rose-500">* (PNG files only, Max 5 images)</span>
                    </label>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                      {tryOnPreviews.length} Image(s)
                    </span>
                  </div>

                  <div className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-white rounded-xl p-5 text-center transition-all">
                    <input
                      type="file"
                      multiple
                      accept="image/png,.png"
                      onChange={handleTryOnFileChange}
                      className="hidden"
                      id="tryon-edit-images-input"
                    />
                    <label htmlFor="tryon-edit-images-input" className="cursor-pointer space-y-2 block">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto shadow-2xs">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-extrabold text-purple-900">
                        Add / Replace Try On PNG Images
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Only .PNG format with transparent background allowed (Up to 5 files)
                      </p>
                    </label>
                  </div>

                  {tryOnPreviews.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs font-bold text-gray-700 mb-2">Try On PNG Previews:</div>
                      <div className="flex flex-wrap gap-3">
                        {tryOnPreviews.map((src, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-purple-300 bg-slate-900 p-1 group shadow-2xs">
                            <img src={src} alt={`Try On ${idx + 1}`} className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => handleRemoveTryOnImage(idx)}
                              className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full text-xs shadow-md hover:bg-rose-600 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Try-On Accessory Type Selection */}
                  <div className="pt-4 border-t border-purple-200 space-y-2">
                    <label className="block text-xs font-black uppercase text-purple-900 tracking-wider">
                      Try-On Type <span className="text-rose-500">* (Select target body/face region)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'Earrings', name: 'Earrings', desc: 'Face & Ears' },
                        { id: 'Glasses', name: 'Glasses', desc: 'Face & Eyes' },
                        { id: 'Necklace', name: 'Necklace', desc: 'Neck & Chest' },
                        { id: 'Bangle', name: 'Bangles', desc: 'Hand & Wrist' },
                        { id: 'Dress', name: 'Dress', desc: 'Body & Torso' },
                        { id: 'Shoes', name: 'Shoes', desc: 'Legs & Feet' },
                        { id: 'Other', name: 'Other', desc: 'General Overlay' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTryOnType(item.id as any)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            tryOnType === item.id
                              ? 'bg-purple-600 text-white border-purple-700 shadow-sm font-extrabold'
                              : 'bg-white text-gray-700 border-purple-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="text-xs font-black">{item.name}</div>
                          <div className={`text-[10px] ${tryOnType === item.id ? 'text-purple-200' : 'text-gray-500'}`}>
                            {item.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Product Size Dropdown */}
                  <div className="pt-4 border-t border-purple-200 space-y-2">
                    <label className="block text-xs font-black uppercase text-purple-900 tracking-wider">
                      Product Try-On Size <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={tryOnSize}
                      onChange={(e) => setTryOnSize(e.target.value as 'Small' | 'Medium' | 'Large')}
                      className="w-full px-4 py-2.5 bg-white border border-purple-300 rounded-xl text-xs text-purple-950 font-bold focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer"
                    >
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                    </select>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Select the product size option to calibrate the Virtual Try-On overlay.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#488710] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Specifications</span>
              </h2>

              <button
                type="button"
                onClick={handleAddSpecRow}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {specs.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                    placeholder="Attribute Name"
                    className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white font-medium"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecRow(idx)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Homepage Display Flags */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#488710] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sparkles className="w-4 h-4" />
              <span>Homepage Display Settings</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                isFeatured ? 'bg-[#f0f9e8] border-[#609f00] text-[#488710]' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#609f00]"
                />
                <div>
                  <div className="text-xs font-black">★ Featured Product</div>
                  <div className="text-[10px] text-gray-500 font-medium">Show on homepage slider</div>
                </div>
              </label>

              <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                isNewArrival ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => setIsNewArrival(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <div>
                  <div className="text-xs font-black">✦ New Arrival</div>
                  <div className="text-[10px] text-gray-500 font-medium">Show in new arrival list</div>
                </div>
              </label>

              <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                isBestSeller ? 'bg-amber-50 border-amber-400 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="w-4 h-4 accent-amber-600"
                />
                <div>
                  <div className="text-xs font-black">🔥 Best Seller</div>
                  <div className="text-[10px] text-gray-500 font-medium">Highlight top seller status</div>
                </div>
              </label>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/admin-dashboard/products"
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-extrabold transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#609f00] hover:bg-[#528900] text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Update Product</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  );
};

export default ProductEdit;
