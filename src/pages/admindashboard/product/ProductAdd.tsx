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
  Shirt,
  Link2,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { useProducts } from '../../../context/ProductContext';
import { useCategories } from '../../../context/CategoryContext';
import { useToast } from '../../../context/ToastContext';
import { SizeVariant, MoreInformation } from '../../../types';
import { AdminLayout } from '../Sidebar';

export const ProductAdd: React.FC = () => {
  const navigate = useNavigate();
  const { addProductOrUpdate, uploadProductImages, uploadTryOnImages, fetchMeeshoProductDetails } = useProducts();
  const { categories } = useCategories();
  const { addToast } = useToast();

  // Meesho Link Upload State
  const [useLinkUpload, setUseLinkUpload] = useState(false);
  const [meeshoUrl, setMeeshoUrl] = useState('');
  const [isFetchingLink, setIsFetchingLink] = useState(false);
  const [linkFetchSuccess, setLinkFetchSuccess] = useState(false);
  const [fetchedImagesReference, setFetchedImagesReference] = useState<string[]>([]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.slug || 'general');
  const [sellingPrice, setSellingPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [discountTag, setDiscountTag] = useState('SAVE 20%');
  const [description, setDescription] = useState('');

  // Product Highlights, Additional Details, and Sizes
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [newSize, setNewSize] = useState('');

  // Size-Wise Pricing & Variants State
  const [sizeVariants, setSizeVariants] = useState<SizeVariant[]>([]);
  const [isAddPriceEnabled, setIsAddPriceEnabled] = useState<boolean>(false);
  const [customVariantSize, setCustomVariantSize] = useState('');
  const [customVariantPrice, setCustomVariantPrice] = useState('');

  // More Information State (Manufacturer & Supplier Compliance)
  const [moreInformation, setMoreInformation] = useState<MoreInformation>({
    manufacturer: 'AHMAD KHAN 18/1 Sarojini Naidu Park Shastri Nagar East Delhi Gali No.1 Near By Kali Mata Mandir 110031',
    importer: 'No information available',
    packer: 'AHMAD KHAN 18/1 Sarojini Naidu Park Shastri Nagar East Delhi Gali No.1 Near By Kali Mata Mandir 110031',
    netWeight: '200'
  });

  // Handle Fetch Details from Meesho Product Link
  const handleFetchMeeshoDetails = async () => {
    if (!meeshoUrl.trim()) {
      addToast('Validation Error', 'Please paste a valid Meesho product URL', 'error');
      return;
    }

    setIsFetchingLink(true);
    setLinkFetchSuccess(false);

    const result = await fetchMeeshoProductDetails(meeshoUrl.trim());
    setIsFetchingLink(false);

    if (result.success && result.data) {
      const data = result.data;
      if (data.name) setName(data.name);
      if (data.description) setDescription(data.description);
      if (data.price) setSellingPrice(data.price.toString());
      if (data.originalPrice) setOriginalPrice(data.originalPrice.toString());

      // Auto-match category
      if (data.category) {
        const catQuery = data.category.toLowerCase();
        const matchedCategory = categories.find(
          (c) => c.slug.toLowerCase() === catQuery || c.name.toLowerCase().includes(catQuery)
        );
        if (matchedCategory) {
          setCategory(matchedCategory.slug);
        }
      }

      if (Array.isArray(data.fetchedImages) && data.fetchedImages.length > 0) {
        setFetchedImagesReference(data.fetchedImages);
      }

      if (Array.isArray(data.highlights) && data.highlights.length > 0) {
        setHighlights(data.highlights);
      }
      if (data.additionalDetails) {
        setAdditionalDetails(data.additionalDetails);
      }
      if (data.moreInformation) {
        setMoreInformation({
          manufacturer: data.moreInformation.manufacturer || '',
          importer: data.moreInformation.importer || '',
          packer: data.moreInformation.packer || '',
          netWeight: data.moreInformation.netWeight || ''
        });
      }
      if (Array.isArray(data.sizeVariants) && data.sizeVariants.length > 0) {
        setSizeVariants(data.sizeVariants);
        setAvailableSizes(data.sizeVariants.map((sv) => sv.size));
      } else if (Array.isArray(data.sizes) && data.sizes.length > 0) {
        setAvailableSizes(data.sizes);
        const baseP = Number(data.price) || Number(sellingPrice) || 271;
        setSizeVariants(
          data.sizes.map((s, i) => ({
            size: s,
            price: baseP + i * 10,
            originalPrice: Math.round((baseP + i * 10) * 1.25),
            isAvailable: true
          }))
        );
      }

      setLinkFetchSuccess(true);
      addToast(
        'Product Details Fetched!',
        'Product details pre-filled from Meesho link including sizes, size-wise pricing, highlights, and manufacturer details.',
        'success'
      );
    } else {
      addToast(
        'Fetch Warning',
        result.message || 'Could not fetch Meesho details automatically. Please enter product details manually.',
        'warning'
      );
    }
  };
  
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

  // Image upload state
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle standard catalog file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files) as File[];
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
      const selectedFiles = Array.from(e.target.files) as File[];

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

  // Size Variant Helpers
  const handleUpdateVariantPrice = (sizeName: string, newPrice: number) => {
    setSizeVariants((prev) =>
      prev.map((sv) =>
        sv.size.toLowerCase() === sizeName.toLowerCase()
          ? { ...sv, price: newPrice, originalPrice: Math.round(newPrice * 1.25) }
          : sv
      )
    );
  };

  const handleToggleVariantAvailable = (sizeName: string) => {
    setSizeVariants((prev) =>
      prev.map((sv) =>
        sv.size.toLowerCase() === sizeName.toLowerCase()
          ? { ...sv, isAvailable: sv.isAvailable === false ? true : false }
          : sv
      )
    );
  };

  const handleAddCustomVariant = () => {
    if (!customVariantSize.trim()) return;
    const sz = customVariantSize.trim();
    const pr = Number(customVariantPrice) || Number(sellingPrice) || 271;
    const existing = sizeVariants.find((sv) => sv.size.toLowerCase() === sz.toLowerCase());
    if (existing) {
      handleUpdateVariantPrice(existing.size, pr);
    } else {
      const newVar: SizeVariant = {
        size: sz,
        price: pr,
        originalPrice: Math.round(pr * 1.25),
        isAvailable: true
      };
      setSizeVariants((prev) => [...prev.filter((sv) => sv.size.toLowerCase() !== sz.toLowerCase()), newVar]);
      setAvailableSizes((prev) => [...prev.filter((s) => s.toLowerCase() !== sz.toLowerCase()), sz]);
    }
    setCustomVariantSize('');
    setCustomVariantPrice('');
  };

  // Highlights & Sizes Helpers
  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights((prev) => [...prev, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSize = () => {
    if (newSize.trim()) {
      const sz = newSize.trim();
      const isAlreadyAdded = sizeVariants.some((sv) => sv.size.toLowerCase() === sz.toLowerCase());
      if (!isAlreadyAdded) {
        const baseP = Number(sellingPrice) || 271;
        setAvailableSizes((prev) => [...prev.filter((s) => s.toLowerCase() !== sz.toLowerCase()), sz]);
        setSizeVariants((prev) => [...prev.filter((sv) => sv.size.toLowerCase() !== sz.toLowerCase()), { size: sz, price: baseP, originalPrice: Math.round(baseP * 1.25), isAvailable: true }]);
      }
      setNewSize('');
    }
  };

  const handleToggleSize = (size: string) => {
    const isAdded = sizeVariants.some((sv) => sv.size.toLowerCase() === size.toLowerCase());
    if (isAdded) {
      // Toggle OFF: remove from sizeVariants and availableSizes
      setSizeVariants((prev) => prev.filter((sv) => sv.size.toLowerCase() !== size.toLowerCase()));
      setAvailableSizes((prev) => prev.filter((s) => s.toLowerCase() !== size.toLowerCase()));
    } else {
      // Toggle ON: add to sizeVariants and availableSizes
      const baseP = Number(sellingPrice) || 271;
      const newVar: SizeVariant = {
        size: size,
        price: baseP,
        originalPrice: Math.round(baseP * 1.25),
        isAvailable: true
      };
      setSizeVariants((prev) => [...prev.filter((sv) => sv.size.toLowerCase() !== size.toLowerCase()), newVar]);
      setAvailableSizes((prev) => [...prev.filter((s) => s.toLowerCase() !== size.toLowerCase()), size]);
    }
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
      highlights,
      additionalDetails: additionalDetails.trim(),
      moreInformation,
      sizes: availableSizes,
      sizeVariants,
      isAddPriceEnabled,
      image: finalGalleryImages[0] || (fetchedImagesReference[0] || ''),
      galleryImages: finalGalleryImages.length > 0 ? finalGalleryImages : fetchedImagesReference,
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
            Fill in product details, pricing, gallery images, Try On options, highlights, and available sizes.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 0: Meesho Link Auto-Fetch Option */}
          <div className="bg-gradient-to-r from-emerald-50/70 via-white to-lime-50/70 border border-emerald-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <Link2 className="w-5 h-5 stroke-[2.5]" />
                <h2 className="text-sm font-black tracking-tight">Auto-Fetch Product from Meesho</h2>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                Link Automation
              </span>
            </div>

            {/* Checkbox: Add Product Using Link */}
            <label className="flex items-center gap-3 cursor-pointer select-none p-3.5 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-50/50 transition-all">
              <input
                type="checkbox"
                checked={useLinkUpload}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setUseLinkUpload(checked);
                  if (!checked) {
                    setMeeshoUrl('');
                    setFetchedImagesReference([]);
                    setLinkFetchSuccess(false);
                  }
                }}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <div>
                <span className="text-xs font-black text-gray-900">Add Product Using Link</span>
                <p className="text-[11px] text-gray-500 font-medium">
                  Enable to enter a Meesho product link and automatically fetch available product details.
                </p>
              </div>
            </label>

            {/* Input Field & Fetch Button - Visible ONLY when Checkbox is ON */}
            {useLinkUpload && (
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={meeshoUrl}
                      onChange={(e) => setMeeshoUrl(e.target.value)}
                      placeholder="Paste Meesho product link (e.g. https://www.meesho.com/s/p/... or https://meesho.com/p/...)"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-emerald-500 font-medium shadow-2xs placeholder:text-gray-400"
                    />
                    <Link2 className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                  </div>

                  <button
                    type="button"
                    onClick={handleFetchMeeshoDetails}
                    disabled={isFetchingLink || !meeshoUrl.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {isFetchingLink ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Fetching Details...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Fetch Product Details</span>
                      </>
                    )}
                  </button>
                </div>

                {linkFetchSuccess && (
                  <div className="p-3 bg-emerald-100/90 border border-emerald-300 rounded-xl text-emerald-950 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Product details fetched & pre-filled below! You can edit any details before saving.</span>
                  </div>
                )}

                {/* Fetched Meesho Images Reference (User manually uploads catalog images below) */}
                {fetchedImagesReference.length > 0 && (
                  <div className="p-4 bg-white border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-gray-800">
                        Fetched Meesho Images Reference ({fetchedImagesReference.length}):
                      </div>
                      <span className="text-[10px] text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Select & Upload Images Manually Below
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Note: These images are for reference only and are NOT automatically uploaded. Select and upload your product catalog images manually in Section 3.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {fetchedImagesReference.map((imgUrl, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                          <img src={imgUrl} alt={`Meesho Ref ${i + 1}`} className="w-full h-full object-cover" />
                          <a
                            href={imgUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="View image"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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

          {/* Section 5: Size-Wise Pricing, Product Highlights & Supplier Compliance */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-6">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#488710] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sparkles className="w-4 h-4" />
              <span>5B. Size-Wise Pricing, Product Highlights & Compliance Info</span>
            </h2>

            {/* Select Size & Size-Wise Pricing */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-800">
                    Select Size &amp; Size-Wise Pricing
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Select sizes for this product. Check "Add Price" to specify custom prices per size.
                  </span>
                </div>
                <label className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={isAddPriceEnabled}
                    onChange={(e) => setIsAddPriceEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#609f00] rounded focus:ring-[#609f00] cursor-pointer"
                  />
                  <span className="text-xs font-extrabold text-gray-900 select-none">Add Price</span>
                </label>
              </div>

              {/* Quick Select Standard Sizes */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <span className="text-[11px] font-bold text-gray-500 mr-1">Quick Select Size:</span>
                {['Free Size', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', 'IND-6', 'IND-7', 'IND-8'].map((sz) => {
                  const isAdded = sizeVariants.some((sv) => sv.size.toLowerCase() === sz.toLowerCase());
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleToggleSize(sz)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-[#609f00] text-white border-[#528900] shadow-2xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {sz} {isAdded ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>

              {/* Size Variants Grid */}
              {sizeVariants.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  {sizeVariants.map((sv) => (
                    <div
                      key={sv.size}
                      className={`p-3 rounded-xl border transition-all space-y-1.5 ${
                        sv.isAvailable !== false
                          ? 'bg-white border-gray-200 shadow-2xs'
                          : 'bg-gray-100 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900">{sv.size}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleVariantAvailable(sv.size)}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                              sv.isAvailable !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sv.isAvailable !== false ? 'In Stock' : 'Out of Stock'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSizeVariants((prev) => prev.filter((item) => item.size.toLowerCase() !== sv.size.toLowerCase()));
                              setAvailableSizes((prev) => prev.filter((s) => s.toLowerCase() !== sv.size.toLowerCase()));
                            }}
                            className="text-gray-400 hover:text-rose-500 p-0.5"
                            title="Remove size"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {isAddPriceEnabled && (
                        <div className="flex items-center gap-1 pt-1">
                          <span className="text-xs font-bold text-gray-500">₹</span>
                          <input
                            type="number"
                            value={sv.price}
                            onChange={(e) => handleUpdateVariantPrice(sv.size, Number(e.target.value))}
                            placeholder="Price"
                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-black text-gray-900 focus:outline-none focus:border-[#609f00]"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-center text-xs text-gray-500">
                  No sizes added yet. Click a quick select size above, fetch from Meesho link, or add a custom size variant below.
                </div>
              )}

              {/* Add Custom Size Variant */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <input
                  type="text"
                  value={customVariantSize}
                  onChange={(e) => setCustomVariantSize(e.target.value)}
                  placeholder="Custom Size (e.g. 34, XXXL)"
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:outline-none focus:border-[#609f00] min-w-[140px]"
                />
                {isAddPriceEnabled && (
                  <input
                    type="number"
                    value={customVariantPrice}
                    onChange={(e) => setCustomVariantPrice(e.target.value)}
                    placeholder="Price (₹)"
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:outline-none focus:border-[#609f00] w-24"
                  />
                )}
                <button
                  type="button"
                  onClick={handleAddCustomVariant}
                  className="px-4 py-2 bg-[#609f00] hover:bg-[#528900] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  + Add Size Variant
                </button>
              </div>
            </div>

            {/* Product Highlights */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <label className="block text-xs font-bold uppercase text-gray-800">
                Product Highlights
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddHighlight(); } }}
                  placeholder="Add highlight (e.g. Color: Black or Fabric: Cotton)"
                  className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:outline-none focus:border-[#609f00]"
                />
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="px-4 py-2 bg-[#609f00] hover:bg-[#528900] text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Highlight</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {highlights.map((hl, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#609f00]" />
                      {hl}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHighlight(idx)}
                      className="text-gray-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* More Information */}
            <div className="space-y-1.5 pt-3 border-t border-gray-100">
              <label className="block text-xs font-bold uppercase text-gray-800">
                More Information
              </label>
              <textarea
                rows={3}
                value={moreInformation.manufacturer || ''}
                onChange={(e) => setMoreInformation((prev) => ({ ...prev, manufacturer: e.target.value }))}
                placeholder="e.g. AHMAD KHAN 18/1 Sarojini Naidu Park Shastri Nagar East Delhi Gali No.1 Near By Kali Mata Mandir 110031"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:outline-none focus:border-[#609f00] leading-relaxed"
              />
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
