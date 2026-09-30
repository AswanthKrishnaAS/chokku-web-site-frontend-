import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  Plus,
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Check,
  Tag,
  Trash2,
  Sparkles,
  ChevronRight,
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

export const ProductAdd: React.FC = () => {
  const navigate = useNavigate();
  const { addProductOrUpdate, uploadProductImages, uploadTryOnImages } = useProducts();
  const { categories } = useCategories();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.slug || 'general');
  const [sellingPrice, setSellingPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [discountTag, setDiscountTag] = useState('SAVE 20%');
  const [description, setDescription] = useState('');
  
  // Homepage flags
  const [isFeatured, setIsFeatured] = useState(true);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Try On feature state
  const [tryOn, setTryOn] = useState(false);
  const [tryOnFiles, setTryOnFiles] = useState<File[]>([]);
  const [tryOnPreviews, setTryOnPreviews] = useState<string[]>([]);
  const [tryOnType, setTryOnType] = useState<'Earrings' | 'Necklace' | 'Dress' | 'Bangle' | 'Shoes' | 'Glasses' | 'Other'>('Earrings');
  const [tryOnSize, setTryOnSize] = useState<'Small' | 'Medium' | 'Large'>('Medium');

  // Specifications key-value pairs
  const [specs, setSpecs] = useState<SpecRow[]>([
    { key: 'Brand', value: 'Chokku Store' },
    { key: 'Warranty', value: '1 Year Manufacturer Warranty' }
  ]);

  // Image upload state
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle standard catalog file selection
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

  // Handle Try On PNG file selection (PNG ONLY, MAX 5)
  const handleTryOnFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);

      // Enforce PNG filter
      const pngFiles = selectedFiles.filter(
        (file) => file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
      );

      if (pngFiles.length !== selectedFiles.length) {
        addToast('Invalid Format', 'Only PNG images (.png) are allowed for Try On!', 'error');
      }

      if (pngFiles.length === 0) return;

      // Maximum 5 PNG images limit
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

  // Specs helper
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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast('Validation Error', 'Product Name is required', 'error');
      return;
    }
    if (!sellingPrice || Number(sellingPrice) < 0) {
      addToast('Validation Error', 'Please enter a valid Selling Price', 'error');
      return;
    }

    if (tryOn && tryOnFiles.length === 0) {
      addToast('Mandatory Field Required', 'Try On is enabled. Please upload at least 1 PNG image for Try On, or uncheck the Try On option.', 'error');
      return;
    }

    setIsSubmitting(true);
    let finalGalleryImages: string[] = [];
    let finalTryOnImages: string[] = [];

    // 1. Upload standard catalog images if selected
    if (files.length > 0) {
      const uploadRes = await uploadProductImages(files);
      if (uploadRes.success && Array.isArray(uploadRes.imageUrls) && uploadRes.imageUrls.length > 0) {
        finalGalleryImages = uploadRes.imageUrls;
      } else {
        addToast('Image Upload Warning', uploadRes.message || 'Error uploading gallery images. Proceeding.', 'warning');
      }
    }

    // 2. Upload Try On PNG images if enabled & selected
    if (tryOn && tryOnFiles.length > 0) {
      const tryOnRes = await uploadTryOnImages(tryOnFiles);
      if (tryOnRes.success && Array.isArray(tryOnRes.imageUrls) && tryOnRes.imageUrls.length > 0) {
        finalTryOnImages = tryOnRes.imageUrls;
      } else {
        addToast('Try On Upload Warning', tryOnRes.message || 'Error uploading Try On images.', 'warning');
      }
    }

    // 3. Format specifications map
    const specMap: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim()) {
        specMap[s.key.trim()] = s.value.trim();
      }
    });

    const categoryObj = categories.find((c) => c.slug === category);
    const categoryName = categoryObj ? categoryObj.name : 'General';

    // 4. Save Product to Database / API
    const result = await addProductOrUpdate({
      name: name.trim(),
      category: category || 'general',
      categoryName,
      price: Number(sellingPrice) || 0,
      originalPrice: Number(originalPrice) || Number(sellingPrice) || 0,
      discountTag: discountTag.trim(),
      description: description.trim(),
      stock: Number(stock) || 0,
      specifications: specMap,
      image: finalGalleryImages[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      galleryImages: finalGalleryImages.length > 0 ? finalGalleryImages : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'],
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
      addToast('Product Created!', `"${name}" has been added to catalog.`, 'success');
      navigate('/admin-dashboard/products');
    } else {
      addToast('Create Failed', result.message || 'Failed to create product', 'error');
    }
  };

  return (
    <AdminLayout activeSection="products" title="Add Product" subtitle="Publish a new product item">
      <div className="space-y-6">

        {/* Top Breadcrumb & Navigation */}
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
            <span className="text-gray-900 font-extrabold">Add New Product</span>
          </div>

          <Link
            to="/admin-dashboard/products"
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
        </div>

        {/* Header Title Banner */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-[#609f00]">
            <Plus className="w-6 h-6 stroke-[2.5]" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Create New Product
            </h1>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Fill in product details, pricing, gallery images, Try On options, and technical specifications.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Basic Information */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#488710] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Info className="w-4 h-4" />
              <span>1. Basic Product Information</span>
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
                  placeholder="e.g. Premium Cotton Shirt"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white placeholder:text-gray-400 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white font-medium cursor-pointer transition-all"
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
                    placeholder="e.g. SAVE 20%, HOT DEAL"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white placeholder:text-gray-400 font-medium transition-all"
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
                  placeholder="Provide detailed information about materials, dimensions, features, or usage..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white placeholder:text-gray-400 font-medium transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#488710] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Package className="w-4 h-4" />
              <span>2. Pricing & Stock Inventory</span>
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
                  placeholder="e.g. 1499"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white placeholder:text-gray-400 font-medium transition-all"
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
                  placeholder="e.g. 1999"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white placeholder:text-gray-400 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">
                  Available Stock Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white placeholder:text-gray-400 font-medium transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Standard Product Images Upload */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#488710] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Upload className="w-4 h-4" />
              <span>3. Standard Product Images</span>
            </h2>

            <div className="space-y-3 pt-1">
              <div className="border-2 border-dashed border-gray-300 hover:border-[#609f00] bg-gray-50/70 hover:bg-[#f0f9e8]/30 rounded-2xl p-6 text-center transition-all">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="product-add-images-input"
                />
                <label htmlFor="product-add-images-input" className="cursor-pointer space-y-2 block">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto text-[#609f00] shadow-2xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-extrabold text-gray-900">
                    Click to select & upload image files
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">Supports PNG, JPG, WEBP formats</p>
                </label>
              </div>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-gray-700 mb-2">Selected Catalog Images:</div>
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

          {/* Section 4: Try On Feature Settings */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Shirt className="w-4 h-4 text-purple-600" />
              <span>4. Virtual Try On Feature</span>
            </h2>

            <div className="space-y-4 pt-1">
              {/* Checkbox */}
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

              {/* PNG Upload Field - Visible ONLY if Try On is checked */}
              {tryOn && (
                <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-purple-900">
                      Try On PNG Overlay Images <span className="text-rose-500">* (PNG files only, Max 5 images)</span>
                    </label>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                      {tryOnFiles.length} / 5 Selected
                    </span>
                  </div>

                  <div className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-white rounded-xl p-5 text-center transition-all">
                    <input
                      type="file"
                      multiple
                      accept="image/png,.png"
                      onChange={handleTryOnFileChange}
                      className="hidden"
                      id="tryon-images-upload-input"
                    />
                    <label htmlFor="tryon-images-upload-input" className="cursor-pointer space-y-2 block">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto shadow-2xs">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-extrabold text-purple-900">
                        Select Try On PNG Images
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Only .PNG format with transparent background is allowed. Up to 5 images.
                      </p>
                    </label>
                  </div>

                  {/* Try On PNG Image Previews */}
                  {tryOnPreviews.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs font-bold text-gray-700 mb-2">Uploaded Try On PNG Images:</div>
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

                  {/* Earring / Product Size Dropdown */}
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

          {/* Section 5: Technical Specifications */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#488710] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>5. Technical Specifications</span>
              </h2>

              <button
                type="button"
                onClick={handleAddSpecRow}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Attribute</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {specs.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                    placeholder="Attribute (e.g. Material)"
                    className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#609f00] focus:bg-white font-medium"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    placeholder="Value (e.g. Cotton)"
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

          {/* Section 6: Homepage Placement */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#488710] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sparkles className="w-4 h-4" />
              <span>6. Homepage Section Promotion</span>
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
                  <div className="text-[10px] text-gray-500 font-medium">Display in home featured slider</div>
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
                  <div className="text-[10px] text-gray-500 font-medium">Show in new arrivals grid</div>
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
                  <div className="text-[10px] text-gray-500 font-medium">Highlight under popular items</div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
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
                  <span>Publishing Product...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save & Publish Product</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  );
};

export default ProductAdd;
