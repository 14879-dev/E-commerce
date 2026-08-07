import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Box, RefreshCw, AlertCircle, Check, X, Filter } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Product, LeatherColor, SoleType, BuckleFinish } from '../../types';

export const ProductsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Table Filters & Selection State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selected3DStatus, setSelected3DStatus] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState<string>('Kaptaan');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form Fields
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    price: 150,
    originalPrice: 180,
    category: 'Kaptaan' as Product['category'],
    description: '',
    featuresStr: '100% Genuine Tanned Leather, Recycled Tire Sole, Solid Brass Buckle',
    materials: 'Full grain leather upper, rubber tread sole',
    craftingTime: '12 Hours Master Work',
    availableSizes: [39, 40, 41, 42, 43, 44, 45],
    availableColors: ['saddle-tan', 'espresso'] as LeatherColor[],
    freeShipping: false,
    images: {
      front: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800',
      back: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800',
      left: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800',
      right: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800',
      top: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800',
      sole: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800'
    }
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const list = await apiService.getProducts();
    setProducts(list);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      subtitle: '',
      price: 150,
      originalPrice: 180,
      category: 'Kaptaan',
      description: '',
      featuresStr: '100% Genuine Tanned Leather, Recycled Tire Sole, Solid Brass Buckle',
      materials: 'Full grain leather upper, rubber tread sole',
      craftingTime: '12 Hours Master Work',
      availableSizes: [39, 40, 41, 42, 43, 44, 45],
      availableColors: ['saddle-tan', 'espresso'],
      freeShipping: false,
      images: {
        front: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800',
        back: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800',
        left: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800',
        right: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800',
        top: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800',
        sole: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800'
      }
    });
    setShowModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      subtitle: product.subtitle || '',
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      category: product.category,
      description: product.description || '',
      featuresStr: product.features ? product.features.join(', ') : '',
      materials: product.materials || '',
      craftingTime: product.craftingTime || '12 Hours',
      availableSizes: product.availableSizes || [39, 40, 41, 42, 43, 44, 45],
      availableColors: product.availableColors || ['saddle-tan'],
      freeShipping: product.freeShipping || false,
      images: product.images
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Product> = {
      name: formData.name,
      subtitle: formData.subtitle,
      price: formData.price,
      originalPrice: formData.originalPrice,
      category: formData.category,
      description: formData.description,
      features: formData.featuresStr.split(',').map(s => s.trim()).filter(Boolean),
      materials: formData.materials,
      craftingTime: formData.craftingTime,
      availableSizes: formData.availableSizes,
      availableColors: formData.availableColors,
      freeShipping: formData.freeShipping,
      images: formData.images,
      status3D: 'ready'
    };

    if (editingProduct) {
      await apiService.updateProduct(editingProduct.id, payload);
    } else {
      await apiService.createProduct(payload);
    }

    setShowModal(false);
    loadProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await apiService.deleteProduct(id);
      loadProducts();
    }
  };

  const handleRetry3D = async (id: string) => {
    await apiService.retry3DPipeline(id);
    loadProducts();
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleApplyBulk = async (action: 'delete' | 'activate' | 'deactivate' | 'change-category') => {
    if (selectedIds.length === 0) return;
    await apiService.bulkUpdateProducts(selectedIds, action, { category: bulkCategory });
    setSelectedIds([]);
    loadProducts();
  };

  const filteredProducts = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== 'All' && p.category !== selectedCategory) {
      return false;
    }
    if (selected3DStatus !== 'All' && p.status3D !== selected3DStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Product Catalog Management</h2>
          <p className="text-xs text-slate-500">Manage 6-angle photogrammetry assets, prices, categories, and stock.</p>
        </div>

        <button onClick={handleOpenAdd} className="btn-copper text-xs py-2.5 px-6 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Chappal Model
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product name, category, or features..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Categories</option>
            <option value="Kaptaan">Kaptaan Series</option>
            <option value="Zalmi">Zalmi Series</option>
            <option value="Norzi">Norzi Series</option>
            <option value="Quetta">Quetta Series</option>
            <option value="Royal">Royal Series</option>
          </select>

          <select
            value={selected3DStatus}
            onChange={e => setSelected3DStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All 3D Statuses</option>
            <option value="ready">Ready (6 Angles)</option>
            <option value="processing">Processing</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Control Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-900">
          <span className="font-semibold">
            {selectedIds.length} products selected for bulk operation:
          </span>

          <div className="flex items-center gap-2">
            <button onClick={() => handleApplyBulk('activate')} className="px-3 py-1 bg-white border border-blue-200 rounded-lg font-bold text-emerald-600 hover:bg-emerald-50">
              Activate Featured
            </button>
            <button onClick={() => handleApplyBulk('deactivate')} className="px-3 py-1 bg-white border border-blue-200 rounded-lg font-bold text-slate-600 hover:bg-slate-100">
              Deactivate
            </button>

            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-blue-200">
              <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)} className="text-xs focus:outline-none bg-transparent">
                <option value="Kaptaan">Kaptaan</option>
                <option value="Zalmi">Zalmi</option>
                <option value="Norzi">Norzi</option>
                <option value="Quetta">Quetta</option>
                <option value="Royal">Royal</option>
              </select>
              <button onClick={() => handleApplyBulk('change-category')} className="font-bold text-blue-600">Apply</button>
            </div>

            <button onClick={() => handleApplyBulk('delete')} className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700">
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                    onChange={handleToggleSelectAll}
                    className="accent-blue-600"
                  />
                </th>
                <th className="py-3 px-4">Model & Silhouette</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Sizes Available</th>
                <th className="py-3 px-4">3D Pipeline Asset</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading catalog items...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No products found matching filters.</td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => handleToggleSelectOne(product.id)}
                        className="accent-blue-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={product.images.front} alt={product.name} className="w-11 h-11 object-cover rounded-lg bg-slate-100" />
                        <div>
                          <h4 className="font-serif font-bold text-slate-900 text-sm line-clamp-1">{product.name}</h4>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{product.subtitle}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold">
                          {product.category}
                        </span>
                        {product.freeShipping && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-bold">
                            Free Shipping
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-serif font-bold text-slate-900 text-sm">
                      Rs. {product.price.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      EU {product.availableSizes.join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          product.status3D === 'ready'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {product.status3D === 'ready' ? 'Ready (6 Angles)' : product.status3D}
                        </span>
                        <button onClick={() => handleRetry3D(product.id)} className="p-1 text-slate-400 hover:text-blue-600" title="Re-run 3D Render">
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button onClick={() => handleOpenEdit(product)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-600 transition-colors" title="Edit Product">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-500 transition-colors" title="Delete Product">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-serif font-bold text-xl text-slate-900">
                {editingProduct ? 'Edit Chappal Model' : 'Create New Chappal Model'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Kaptaan Royal Tan"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category / Silhouette</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Kaptaan">Kaptaan Series</option>
                    <option value="Zalmi">Zalmi Series</option>
                    <option value="Norzi">Norzi Series</option>
                    <option value="Quetta">Quetta Series</option>
                    <option value="Royal">Royal Series</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Price (PKR Rs.)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Original Price (PKR Rs.)</label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                <label className="flex items-center gap-2 text-xs font-bold text-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.freeShipping}
                    onChange={e => setFormData({ ...formData, freeShipping: e.target.checked })}
                    className="accent-emerald-600 w-4 h-4 rounded"
                  />
                  <span>Offer Free Shipping on this Product (Overrides standard shipping charges)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Authentic Peshawar handcrafting details..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* 6-Angle Image Upload Fields with Thumbnail Previews */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-blue-600">
                    6-Angle Photogrammetry Image Assets (Required for 3D Orbiting)
                  </label>
                  <span className="text-[10px] text-slate-400">All 6 angles required</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(['front', 'back', 'left', 'right', 'top', 'sole'] as const).map(angle => (
                    <div key={angle} className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{angle} Camera Shot</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={formData.images[angle]}
                          onChange={e => setFormData({
                            ...formData,
                            images: { ...formData.images, [angle]: e.target.value }
                          })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-[11px] focus:border-blue-600 focus:outline-none"
                        />
                        <img src={formData.images[angle]} alt={angle} className="w-8 h-8 rounded object-cover border border-slate-200 bg-slate-100 shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)} className="btn-glass text-xs py-2 px-5">
                  Cancel
                </button>
                <button type="submit" className="btn-copper text-xs py-2 px-6">
                  Save Product Model
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
