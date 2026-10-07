import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Plus, Edit, Trash2, Box, X, Upload,
  Sparkles, Filter, AlertCircle, Loader2,
  Layers, CheckCircle2, Star, Image as ImageIcon, Download
} from 'lucide-react';
import { apiService } from '../../services/api';
import type { Product, Category, LeatherColor } from '../../types';

const LEATHER_COLORS: { id: LeatherColor; name: string; hex: string }[] = [
  { id: 'saddle-tan', name: 'Saddle Tan', hex: '#7B4A28' },
  { id: 'espresso', name: 'Espresso', hex: '#2A1708' },
  { id: 'burnt-copper', name: 'Burnt Copper', hex: '#8C3A18' },
  { id: 'mustard-gold', name: 'Mustard Gold', hex: '#A07010' },
  { id: 'midnight-black', name: 'Midnight Black', hex: '#161412' },
  { id: 'vintage-tan', name: 'Vintage Tan', hex: '#9A5E35' },
];

const STANDARD_SIZES = [7, 8, 9, 10, 11, 12, 13];

interface CustomColorItem {
  id: string;
  name: string;
  hex: string;
}

const getStoredCustomColors = (): CustomColorItem[] => {
  try {
    const saved = localStorage.getItem('psh_custom_colors');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveStoredCustomColors = (list: CustomColorItem[]) => {
  try {
    localStorage.setItem('psh_custom_colors', JSON.stringify(list));
  } catch {}
};

export const ProductsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Custom Colors State (for Admin & Manager)
  const [customColors, setCustomColors] = useState<CustomColorItem[]>(getStoredCustomColors);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#2A3A4A');

  // Gemini AI Vision State
  const [isAnalyzingWithAi, setIsAnalyzingWithAi] = useState<boolean>(false);
  const [aiAnalyzingIndex, setAiAnalyzingIndex] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    articleTag: string;
    name: string;
    subtitle: string;
    category: string;
    price: number;
    costPrice: number;
    originalPrice?: number;
    description: string;
    features: string[];
    materials: string;
    craftingTime: string;
    stockCount: number;
    featured: boolean;
    availableSizes: number[];
    availableColors: (LeatherColor | string)[];
  }>({
    articleTag: 'KDM-00001',
    name: 'KDM-00001',
    subtitle: 'Handcrafted Double Sole Peshawari Chappal',
    category: 'None',
    price: 0,
    costPrice: 0,
    originalPrice: 0,
    description: '',
    features: ['100% Genuine Full-Grain Leather', 'Dual Rubber Tire Sole', 'Hand-stitched with waxed linen thread'],
    materials: 'Saddle Tan Cowhide Upper, Recycled Tire Sole, Brass Hardware',
    craftingTime: '12 Hours Master Artisan Handwork',
    stockCount: 1,
    featured: false,
    availableSizes: [7, 8, 9, 10, 11, 12, 13],
    availableColors: ['saddle-tan', 'espresso'],
  });

  // Dynamic Multi-Image Gallery State (No rigid angle limits)
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  const [featureInput, setFeatureInput] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Multi-file upload ref
  const multipleFileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to generate next sequential article code (e.g. KDM-00001, KDM-00002)
  const generateNextTag = (prods: Product[]): string => {
    let maxNum = 0;
    prods.forEach((p) => {
      const tagStr = p.articleTag || p.name || '';
      const match = tagStr.match(/KDM-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const next = maxNum + 1;
    return `KDM-${String(next).padStart(5, '0')}`;
  };

  useEffect(() => {
    loadAllData();

    const handleCategoriesChanged = () => {
      loadAllData();
    };
    // Silent auto-refresh - reload products every ~9s
    const handleAutoRefresh = async () => {
      try {
        const [prods, cats] = await Promise.all([
          apiService.getProducts(true),
          apiService.getCategories(true),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch {}
    };
    window.addEventListener('psh:categories-changed', handleCategoriesChanged);
    window.addEventListener('psh:auto-refresh', handleAutoRefresh);
    return () => {
      window.removeEventListener('psh:categories-changed', handleCategoriesChanged);
      window.removeEventListener('psh:auto-refresh', handleAutoRefresh);
    };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        apiService.getProducts(true),
        apiService.getCategories(true),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      showNotification('error', 'Failed to load products or categories');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleExportCSV = () => {
    const headers = [
      'Article Tag', 'Product Name', 'Category', 'Price (Rs.)',
      'Cost Price (Rs.)', 'Stock Count', 'Available Sizes', 'Featured'
    ];

    const safeRows = products.map(p => [
      p.articleTag || '',
      p.name || '',
      p.category || 'None',
      p.price,
      (p as any).costPrice ?? 0,
      (p as any).stockCount ?? 0,
      ((p as any).availableSizes || []).join('|'),
      p.featured ? 'Yes' : 'No',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...safeRows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `peshawari_products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Custom Color Handlers
  const handleAddCustomColor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newColorName.trim();
    if (!trimmed) {
      showNotification('error', 'Please enter a color name.');
      return;
    }
    const colorId = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = customColors.find(c => c.id === colorId || c.name.toLowerCase() === trimmed.toLowerCase());
    if (!existing) {
      const newColor: CustomColorItem = {
        id: colorId,
        name: trimmed,
        hex: newColorHex || '#334155',
      };
      const updatedList = [...customColors, newColor];
      setCustomColors(updatedList);
      saveStoredCustomColors(updatedList);
    }
    if (!formData.availableColors.includes(colorId)) {
      setFormData(prev => ({
        ...prev,
        availableColors: [...prev.availableColors, colorId],
      }));
    }
    setNewColorName('');
    showNotification('success', `Color "${trimmed}" added!`);
  };

  const handleRemoveCustomColorDefinition = (colorId: string) => {
    const updated = customColors.filter(c => c.id !== colorId);
    setCustomColors(updated);
    saveStoredCustomColors(updated);
    setFormData(prev => ({
      ...prev,
      availableColors: prev.availableColors.filter(c => c !== colorId),
    }));
  };

  // Open Add Product Modal with auto-generated internal tag & customer-facing title
  const handleOpenAddModal = () => {
    const nextTag = generateNextTag(products);
    setEditingProduct(null);
    setFormData({
      articleTag: nextTag,
      name: '',
      subtitle: '',
      category: 'None',
      price: 0,
      costPrice: 0,
      originalPrice: 0,
      description: '',
      features: ['100% Genuine Full-Grain Leather', 'Dual Rubber Tire Sole', 'Hand-stitched with waxed linen thread'],
      materials: 'Saddle Tan Cowhide Upper, Recycled Tire Sole, Brass Hardware',
      craftingTime: '12 Hours Master Artisan Handwork',
      stockCount: 1,
      featured: false,
      availableSizes: [7, 8, 9, 10, 11, 12, 13],
      availableColors: ['saddle-tan', 'espresso'],
    });
    setGalleryImages([]);
    setCoverIndex(0);
    setNewImageUrl('');
    setFeatureInput('');
    setIsFormModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    const existingTag = p.articleTag || (p.name && /^KDM-\d+/i.test(p.name) ? p.name : '');
    const rawSizes = Array.isArray(p.availableSizes)
      ? p.availableSizes.map(Number).filter(s => s >= 7 && s <= 13)
      : [];

    setFormData({
      articleTag: existingTag,
      name: p.name || existingTag || '',
      subtitle: p.subtitle || '',
      category: p.category || 'None',
      price: p.price || 0,
      costPrice: (p as any).costPrice ?? 0,
      originalPrice: (p.originalPrice && p.originalPrice > 0) ? p.originalPrice : undefined,
      description: p.description || '',
      features: Array.isArray(p.features) ? [...p.features] : [],
      materials: p.materials || '',
      craftingTime: p.craftingTime || '12 Hours Master Artisan Handwork',
      stockCount: (p as any).stockCount ?? 50,
      featured: !!p.featured,
      availableSizes: rawSizes.length > 0 ? rawSizes : [7, 8, 9, 10, 11, 12, 13],
      availableColors: p.availableColors ? [...p.availableColors] : ['saddle-tan'],
    });

    const extracted: string[] = [];
    if (Array.isArray((p.images as any)?.gallery) && (p.images as any).gallery.length > 0) {
      extracted.push(...(p.images as any).gallery.filter(Boolean));
    } else if (p.images) {
      const angles = ['front', 'back', 'left', 'right', 'top', 'sole'] as const;
      for (const a of angles) {
        if (p.images[a]) extracted.push(p.images[a]!);
      }
    }
    setGalleryImages(extracted);
    setCoverIndex(0);
    setNewImageUrl('');
    setFeatureInput('');
    setIsFormModalOpen(true);
  };

  // Handle Form Submission (Create or Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('error', 'Product name is required.');
      return;
    }

    setFormSubmitting(true);
    const primaryFront = galleryImages[coverIndex] || galleryImages[0] || '';
    const imagesPayload = {
      front: primaryFront,
      gallery: galleryImages,
      back: galleryImages[1] || '',
      left: galleryImages[2] || '',
      right: galleryImages[3] || '',
      top: galleryImages[4] || '',
      sole: galleryImages[5] || '',
    };

    const cleanSizes = (formData.availableSizes || []).map(Number).filter(s => s >= 7 && s <= 13);
    const sanitizedPayload = {
      ...formData,
      articleTag: (formData.articleTag || '').trim(),
      costPrice: Number(formData.costPrice) || 0,
      category: formData.category?.trim() || 'None',
      originalPrice: (formData.originalPrice && Number(formData.originalPrice) > 0) ? Number(formData.originalPrice) : undefined,
      availableSizes: cleanSizes.length > 0 ? cleanSizes : [7, 8, 9, 10, 11, 12, 13],
      images: imagesPayload,
    };

    try {
      if (editingProduct) {
        const updated = await apiService.updateProduct(editingProduct.id, sanitizedPayload);
        setProducts(prev => prev.map(p => (p.id === editingProduct.id ? updated : p)));
        showNotification('success', `Product "${updated.name}" updated successfully!`);
      } else {
        const created = await apiService.createProduct(sanitizedPayload);
        setProducts(prev => [created, ...prev]);
        showNotification('success', `Product "${created.name}" created successfully!`);
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save product.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await apiService.deleteProduct(deletingProduct.id);
      setProducts(prev => prev.filter(p => p.id !== deletingProduct.id));
      showNotification('success', `Product "${deletingProduct.name}" removed.`);
      setDeletingProduct(null);
    } catch {
      showNotification('error', 'Failed to delete product.');
    }
  };

  // Dynamic Image Gallery Handlers (Upload as many as desired)
  const handleMultipleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let loaded = 0;
    const base64List: string[] = [];

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        if (base64Data) {
          base64List.push(base64Data);
        }
        loaded++;
        if (loaded === fileList.length) {
          setGalleryImages((prev) => [...prev, ...base64List]);
          showNotification('success', `Added ${base64List.length} photo(s).`);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setGalleryImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
    showNotification('success', 'Image URL added to gallery.');
  };

  const handleRemoveImageAt = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    if (coverIndex >= index && coverIndex > 0) {
      setCoverIndex(coverIndex - 1);
    }
  };

  const handleSetCoverPhoto = (index: number) => {
    setCoverIndex(index);
    showNotification('success', `Photo #${index + 1} marked as the Cover Photo.`);
  };

  const handleAiAnalyzeProduct = async (specificImage?: string, index?: number) => {
    const targetImage = specificImage || galleryImages[coverIndex] || galleryImages[0];
    if (!targetImage) {
      showNotification('error', 'Please upload or add at least one product photo first.');
      return;
    }

    setIsAnalyzingWithAi(true);
    if (index !== undefined) {
      setAiAnalyzingIndex(index);
    }

    try {
      showNotification('success', 'Gemini Vision AI is analyzing leather tone, silhouette & craftsmanship...');
      const result = await apiService.aiAnalyzeProduct(targetImage);
      if (result.success && result.data) {
        const { name, subtitle, category, detectedColor, colorHex, description, materials, craftingTime, features } = result.data;

        // Auto-register detected color if present
        let detectedColorSlug = '';
        if (detectedColor && colorHex) {
          detectedColorSlug = detectedColor.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const existing = customColors.find(c => c.name.toLowerCase() === detectedColor.toLowerCase() || c.id === detectedColorSlug);
          if (!existing) {
            const newColorItem = { id: detectedColorSlug, name: detectedColor, hex: colorHex };
            const updatedCustom = [...customColors, newColorItem];
            setCustomColors(updatedCustom);
            saveStoredCustomColors(updatedCustom);
          }
        }

        // Auto-fill all details EXCEPT pricing (price, costPrice, originalPrice remain untouched)
        setFormData(prev => {
          const updatedColors = [...prev.availableColors];
          if (detectedColorSlug && !updatedColors.some(c => c.toLowerCase() === detectedColorSlug || c.toLowerCase() === (detectedColor || '').toLowerCase())) {
            updatedColors.push(detectedColorSlug);
          }

          return {
            ...prev,
            name: name || prev.name,
            subtitle: subtitle || prev.subtitle,
            category: category && category !== 'None' ? category : prev.category,
            description: description || prev.description,
            materials: materials || prev.materials,
            craftingTime: craftingTime || prev.craftingTime,
            features: Array.isArray(features) && features.length > 0 ? features : prev.features,
            availableColors: updatedColors,
            // STRICT CONSTRAINT: price, costPrice, and originalPrice are untouched!
          };
        });

        showNotification('success', '✨ AI auto-filled product details & detected color! (Pricing left for you to set)');
      } else {
        showNotification('error', result.error || 'Gemini AI analysis failed.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to analyze product with Gemini AI.');
    } finally {
      setIsAnalyzingWithAi(false);
      setAiAnalyzingIndex(null);
    }
  };

  // Features List Helper
  const addFeature = () => {
    if (!featureInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, featureInput.trim()],
    }));
    setFeatureInput('');
  };

  const removeFeature = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  // Size toggle helper
  const toggleSize = (size: number) => {
    setFormData(prev => ({
      ...prev,
      availableSizes: prev.availableSizes.includes(size)
        ? prev.availableSizes.filter(s => s !== size)
        : [...prev.availableSizes, size].sort((a, b) => a - b),
    }));
  };

  // Color toggle helper
  const toggleColor = (colorId: LeatherColor | string) => {
    setFormData(prev => ({
      ...prev,
      availableColors: prev.availableColors.includes(colorId)
        ? prev.availableColors.filter(c => c !== colorId)
        : [...prev.availableColors, colorId],
    }));
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.articleTag && p.articleTag.toLowerCase().includes(q)) ||
        p.name.toLowerCase().includes(q) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.materials && p.materials.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (categoryFilter !== 'all') {
        if ((p.category || '').toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }
      }

      const stock = (p as any).stockCount ?? 50;
      if (stockFilter === 'in-stock') return stock > 5;
      if (stockFilter === 'low-stock') return stock > 0 && stock <= 5;
      if (stockFilter === 'out-of-stock') return stock === 0;

      return true;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Box className="w-4 h-4" />
            Inventory & Catalog Management
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Full CRUD control: create, edit, remove products, categorize items, and manage transparent product images.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs hover:scale-102"
            style={{ color: '#047857', backgroundColor: '#ECFDF5', borderColor: '#34D399' }}
            title="Download products as CSV"
          >
            <Download className="w-4 h-4" style={{ color: '#047857', stroke: '#047857' }} />
            Export CSV
          </button>
          {/* Add Product Button */}
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] text-xs font-bold rounded-xl shadow-sm transition-all transform active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            {notification.message}
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-2xl font-black text-slate-900">{products.length}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Products</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-2xl font-black" style={{ color: '#059669' }}>
            {products.filter(p => ((p as any).stockCount ?? 50) > 5).length}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">In Stock</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-2xl font-black" style={{ color: '#DC2626' }}>
            {products.filter(p => {
              const count = (p as any).stockCount ?? 50;
              return count > 0 && count <= 5;
            }).length}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Low Stock (≤5)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-2xl font-black" style={{ color: '#2563EB' }}>{categories.length}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Categories</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, materials, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Layers className="w-3.5 h-3.5" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.disabled ? '(Disabled)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in-stock">In Stock (&gt;5)</option>
              <option value="low-stock">Low Stock (1-5)</option>
              <option value="out-of-stock">Out of Stock (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading Product Catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 text-center">
          <Box className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No products match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Try adjusting your search query or category filters, or click below to add a new product.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all cursor-pointer"
          >
            Add New Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Inventory</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredProducts.map((product) => {
                  const frontImg = product.images?.front || Object.values(product.images || {}).find(Boolean);
                  const stock = (product as any).stockCount ?? 50;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 relative">
                            {frontImg ? (
                              <img
                                src={frontImg}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Box className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {product.articleTag && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-amber-400 font-mono text-[10px] font-bold tracking-wider shrink-0 shadow-xs border border-slate-800">
                                  {product.articleTag}
                                </span>
                              )}
                              <div className="font-bold text-slate-900 text-sm">{product.name}</div>
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{product.subtitle}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-100">
                          {product.category && product.category !== 'None' ? product.category : 'General'}
                        </span>
                      </td>

                      {/* Price & Confidential Supplier Cost */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">Rs. {product.price.toLocaleString()}</div>
                        {Boolean(product.costPrice && product.costPrice > 0) && (
                          <div className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5" title="Supplier Cost Price (Hidden from public)">
                            Buy: Rs. {product.costPrice?.toLocaleString()}
                          </div>
                        )}
                        {Boolean(product.originalPrice && product.originalPrice > product.price) && (
                          <div className="text-[11px] text-slate-400 line-through mt-0.5">
                            Rs. {product.originalPrice?.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Stock Count */}
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-800">{stock}</span> units
                      </td>

                      {/* Inventory Status Badge */}
                      <td className="py-3 px-4">
                        {stock > 5 ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-2xs"
                            style={{ color: '#047857', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                            In Stock
                          </span>
                        ) : stock > 0 ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-2xs"
                            style={{ color: '#B91C1C', backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EF4444' }} />
                            Low Stock (≤5)
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-2xs"
                            style={{ color: '#B91C1C', backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EF4444' }} />
                            Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs hover:scale-105"
                            style={{ color: '#D97706', backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }}
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" style={{ color: '#D97706', stroke: '#D97706' }} />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="p-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs hover:scale-105"
                            style={{ color: '#DC2626', backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }}
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: '#DC2626', stroke: '#DC2626' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* Create / Edit Product Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Configure product specifications and product photos.</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-6">
              {/* ── 1. Article Tagging & Customer-Facing Title / Subtitle ── */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400 font-mono text-xs font-black tracking-wider shadow-xs">
                      INTERNAL TAG
                    </span>
                    <span className="text-xs font-bold text-slate-800">For Admin / Manager Search &amp; Inventory</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = generateNextTag(products);
                      setFormData(prev => ({
                        ...prev,
                        articleTag: next,
                      }));
                      showNotification('success', `Assigned tag: ${next}`);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Auto-Generate Next Tag
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Article Code / Tag Input (Internal for finding & inventory) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Internal Article Tag / Code * <span className="text-slate-400 font-normal lowercase">(for staff tracking)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KDM-00001"
                      value={formData.articleTag}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormData(prev => ({
                          ...prev,
                          articleTag: val,
                        }));
                      }}
                      className="w-full px-3.5 py-2 text-xs font-mono font-bold text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Used by admin and manager to search and find this chappal in inventory.
                    </p>
                  </div>

                  {/* Customer-Facing Product Title Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Customer-Facing Product Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kaptaan Signature Pure Leather Chappal"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      The product title displayed to customers across the public storefront.
                    </p>
                  </div>
                </div>

                {/* Customer-Facing Subtitle Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer-Facing Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Handcrafted from pure full-grain cowhide leather with durable tire sole"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Shown directly below the title for public customers.
                  </p>
                </div>
              </div>

              {/* ── 2. Pricing & Category Grid ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="None">None / General</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} {c.disabled ? '(Disabled)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Selling Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Supplier Buy Price (Rs.) *</span>
                    <span className="text-[10px] text-emerald-600 font-medium lowercase">dashboard only</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.costPrice > 0 ? formData.costPrice : ''}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value === '' ? 0 : Number(e.target.value) || 0 })}
                    placeholder="e.g. 1500"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-emerald-300 bg-emerald-50/40 text-emerald-950 font-semibold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Confidential: for inventory investment & net profit calc
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Original / Strike Price (Rs.)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.originalPrice || ''}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) || undefined })}
                    placeholder="Optional for discount"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Stock Count and Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Stock Inventory Count
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.stockCount}
                    onChange={(e) => setFormData({ ...formData, stockCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-700">Feature on Homepage</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of craftsmanship, heritage cut, and comfort..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Materials & Crafting Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Materials
                  </label>
                  <input
                    type="text"
                    value={formData.materials}
                    onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                    placeholder="e.g. Grade-A Calfskin, Brass Buckles, Tire Sole"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Crafting Time
                  </label>
                  <input
                    type="text"
                    value={formData.craftingTime}
                    onChange={(e) => setFormData({ ...formData, craftingTime: e.target.value })}
                    placeholder="e.g. 12 Hours Master Artisan Handwork"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Sizes Selection (7 to 13) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Available Sizes (7 to 13) *
                  </label>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {formData.availableSizes.length} Selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STANDARD_SIZES.map((size) => {
                    const isSelected = formData.availableSizes.includes(size);
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20 ring-1 ring-blue-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Size {size}
                        {isSelected && <span className="ml-1 text-blue-200">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── 3. Selected Colours (Presets + Admin/Manager Manual Adder) ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Selected Leather Colours / Shades *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Choose from standard shades or add custom colors manually (Admin &amp; Manager).
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {formData.availableColors.length} Selected
                  </span>
                </div>

                {/* Predefined Colors List */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {LEATHER_COLORS.map((c) => {
                    const isSelected = formData.availableColors.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleColor(c.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-white text-slate-900 border-blue-600 shadow-xs ring-1 ring-blue-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                        {c.name}
                        {isSelected && <span className="text-blue-600 font-bold ml-0.5">✓</span>}
                      </button>
                    );
                  })}

                  {/* Custom Added Colors */}
                  {customColors.map((c) => {
                    const isSelected = formData.availableColors.includes(c.id);
                    return (
                      <div key={c.id} className="relative inline-flex items-center group">
                        <button
                          type="button"
                          onClick={() => toggleColor(c.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-white text-slate-900 border-purple-600 shadow-xs ring-1 ring-purple-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                          {c.name}
                          {isSelected && <span className="text-purple-600 font-bold ml-0.5">✓</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomColorDefinition(c.id)}
                          className="opacity-0 group-hover:opacity-100 -ml-2 mr-1 p-0.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all cursor-pointer"
                          title={`Delete ${c.name} color`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Manual Custom Color Addition Row */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      Add Colour Manually
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Available to Admin &amp; Manager</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                        title="Pick color swatch hex"
                      />
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{newColorHex}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Color name (e.g. Royal Navy, Dark Maroon, Olive Green, Smoke Grey)"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomColor();
                        }
                      }}
                      className="flex-1 min-w-[200px] px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomColor()}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Color
                    </button>
                  </div>
                </div>
              </div>

              {/* Bullet Features */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bullet Features
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a key feature (e.g. Memory foam cushioned footbed)"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    className="flex-1 px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
                    >
                      {feat}
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>              {/* ── Dynamic Product Photo Gallery & Gemini Vision AI ── */}
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Product Photo Gallery &amp; Gemini Vision AI
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Upload photos from your device or paste a URL. Gemini AI can automatically analyze the image to detect leather shade, write title, description, materials, crafting time &amp; feature specs.
                    </p>
                  </div>

                  {/* Gemini Auto-Fill Button */}
                  <button
                    type="button"
                    disabled={isAnalyzingWithAi || galleryImages.length === 0}
                    onClick={() => handleAiAnalyzeProduct()}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0 ${
                      galleryImages.length === 0
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : isAnalyzingWithAi
                        ? 'bg-indigo-600 text-white animate-pulse'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20'
                    }`}
                    title={
                      galleryImages.length === 0
                        ? 'Upload at least one photo first to enable AI analysis'
                        : 'Analyze photo to auto-fill title, description, color, and specs'
                    }
                  >
                    {isAnalyzingWithAi && aiAnalyzingIndex === null ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Gemini AI Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>Auto-Fill Details with Gemini AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Exact Container Dimensions & Guidelines Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-950">
                  <div className="flex items-center gap-2">
                    <span className="font-black px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] tracking-wide uppercase">
                      4:3 Ratio
                    </span>
                    <span className="font-semibold">
                      Recommended Container Size: <strong className="font-mono text-blue-700">800 × 600 px</strong>
                    </span>
                  </div>
                  <span className="text-slate-500 text-[10px]">
                    High-Res: <strong className="font-mono text-slate-700">1200 × 900 px</strong> • Compact: <strong className="font-mono text-slate-700">400 × 300 px</strong>
                  </span>
                </div>

                {/* Hidden Multi-file input */}
                <input
                  ref={multipleFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleMultipleFiles}
                />

                {/* Upload & Add Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-2xl bg-slate-100/70 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => multipleFileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Pictures from Device</span>
                  </button>

                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="url"
                      placeholder="Or paste an image web URL here..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer"
                    >
                      Add Photo
                    </button>
                  </div>
                </div>

                {/* Photo Gallery Grid */}
                {galleryImages.length === 0 ? (
                  <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">No product photos added yet</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Click &quot;Upload Pictures from Device&quot; to pick multiple photos, or paste an image URL above. You can upload as many as you wish!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {galleryImages.map((url, idx) => {
                      const isCover = idx === coverIndex;

                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border transition-all space-y-2 flex flex-col justify-between ${
                            isCover ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/20' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                              Photo #{idx + 1}
                            </span>
                            {isCover ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs">
                                <Star className="w-2.5 h-2.5 fill-current" /> Cover (Front)
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetCoverPhoto(idx)}
                                className="text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
                              >
                                Set as Cover
                              </button>
                            )}
                          </div>

                          {/* Image Box */}
                          <div
                            className="h-28 rounded-lg border border-slate-200 overflow-hidden relative flex items-center justify-center bg-slate-50"
                            style={{
                              backgroundImage:
                                'radial-gradient(#cbd5e1 1px, transparent 1px), radial-gradient(#cbd5e1 1px, #f8fafc 1px)',
                              backgroundSize: '16px 16px',
                              backgroundPosition: '0 0, 8px 8px',
                            }}
                          >
                            <img
                              src={url}
                              alt={`Product photo ${idx + 1}`}
                              className="max-h-full max-w-full object-contain p-1"
                            />

                            {isAnalyzingWithAi && aiAnalyzingIndex === idx && (
                              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2">
                                <Loader2 className="w-5 h-5 animate-spin mb-1 text-blue-400" />
                                <span className="text-[10px] font-bold">AI Analyzing...</span>
                              </div>
                            )}
                          </div>

                          {/* Photo Actions */}
                          <div className="flex items-center gap-1 pt-1">
                            <button
                              type="button"
                              disabled={isAnalyzingWithAi}
                              onClick={() => handleAiAnalyzeProduct(url, idx)}
                              className="flex-1 px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              title="Analyze this specific photo with Gemini AI"
                            >
                              <Sparkles className="w-3 h-3 text-blue-600" />
                              <span>Analyze with AI</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveImageAt(idx)}
                              className="p-1 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProduct ? 'Update Product' : 'Save New Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Product?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>"{deletingProduct.name}"</strong>? This product will be
                permanently removed from your store catalog.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
