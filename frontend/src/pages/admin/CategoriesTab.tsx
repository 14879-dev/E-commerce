import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers, Plus, Edit2, Trash2, Search, Check, X,
  AlertCircle, Eye, EyeOff, Image as ImageIcon, Loader2, Filter
} from 'lucide-react';
import { apiService } from '../../services/api';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import type { Category, Product } from '../../types';

export const CategoriesTab: React.FC = () => {
  const { settings, toggleHideCategories } = useStoreSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    disabled: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        apiService.getCategories(true), // load all including disabled
        apiService.getProducts(true),   // load all products including disabled
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err: any) {
      setErrorMsg('Failed to load categories. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // Map product counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      const catKey = (p.category || '').toLowerCase();
      counts[catKey] = (counts[catKey] || 0) + 1;
    }
    return counts;
  }, [products]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return !c.disabled;
      if (statusFilter === 'disabled') return c.disabled;
      return true;
    });
  }, [categories, searchTerm, statusFilter]);

  const activeCount = categories.filter((c) => !c.disabled).length;
  const disabledCount = categories.filter((c) => c.disabled).length;

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      disabled: false,
    });
    setErrorMsg('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      disabled: !!cat.disabled,
    });
    setErrorMsg('');
  };

  const handleNameChange = (val: string) => {
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: editingCategory ? prev.slug : autoSlug,
    }));
  };

  const handleToggleDisabled = async (cat: Category) => {
    try {
      const updated = await apiService.toggleCategoryStatus(cat.id);
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
      setSuccessMsg(`Category "${cat.name}" is now ${updated.disabled ? 'Disabled' : 'Active'}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setErrorMsg(`Failed to update status for ${cat.name}.`);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editingCategory) {
        const updated = await apiService.updateCategory(editingCategory.id, formData);
        setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? updated : c)));
        setEditingCategory(null);
        setSuccessMsg(`Category "${updated.name}" updated successfully!`);
        apiService.getProducts(true).then(setProducts).catch(() => {});
      } else {
        const created = await apiService.createCategory(formData);
        setCategories((prev) => [...prev, created]);
        setIsCreateModalOpen(false);
        setSuccessMsg(`Category "${created.name}" created successfully!`);
      }
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setSubmitting(true);
    try {
      await apiService.deleteCategory(deletingCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      setSuccessMsg(`Category "${deletingCategory.name}" removed.`);
      setDeletingCategory(null);
      apiService.getProducts(true).then(setProducts).catch(() => {});
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setErrorMsg(`Failed to delete category.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            Catalog Architecture
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Categories Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Organize collections, control storefront category visibility, and toggle category options.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all transform active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Category
        </button>
      </div>

      {/* Master Switch: Public Store Category Display */}
      <div className={`p-5 rounded-2xl border transition-all ${
        settings.hideCategories
          ? 'bg-amber-50/90 border-amber-300 shadow-sm'
          : 'bg-emerald-50/90 border-emerald-300 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              settings.hideCategories ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {settings.hideCategories ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Public Storefront Category Visibility
                </h3>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  settings.hideCategories
                    ? 'bg-amber-200/80 text-amber-900 border-amber-300'
                    : 'bg-emerald-200/80 text-emerald-900 border-emerald-300'
                }`}>
                  {settings.hideCategories ? 'Categories Fully Hidden' : 'Categories Visible'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                {settings.hideCategories
                  ? 'All categories and the "Shop by Category" section are currently completely hidden from public visitors. The navigation displays "Products" directly, and the hero section prompts "Shop Now".'
                  : 'Categories are currently active on the public storefront ("Shop by Category" section on homepage, "Catalog" in navigation, and category filters in shop).'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                toggleHideCategories();
                setSuccessMsg(
                  settings.hideCategories
                    ? 'Categories are now VISIBLE on the public store.'
                    : 'Categories are now FULLY HIDDEN from the public store.'
                );
                setTimeout(() => setSuccessMsg(''), 4000);
              }}
              className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
                settings.hideCategories
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {settings.hideCategories ? (
                <>
                  <Eye className="w-4 h-4" /> Show Categories on Public Store
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" /> Fully Hide Categories from Public
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{categories.length}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Categories</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{activeCount}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Active on Storefront</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <EyeOff className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{disabledCount}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Disabled Categories</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            {errorMsg}
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search category name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({categories.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('disabled')}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === 'disabled' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Disabled ({disabledCount})
            </button>
          </div>
        </div>
      </div>

      {/* Categories Cards / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading Categories Catalog...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center">
          <Layers className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No categories found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {searchTerm ? `No category matching "${searchTerm}".` : 'Get started by creating your first category.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((category) => {
            const prodCount = categoryCounts[category.name.toLowerCase()] || categoryCounts[category.slug.toLowerCase()] || 0;
            const isDisabled = !!category.disabled;

            return (
              <div
                key={category.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  isDisabled
                    ? 'border-amber-200/90 bg-amber-50/20 opacity-85 shadow-xs'
                    : 'border-slate-200/80 hover:shadow-md hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Category Image Header */}
                  <div className="h-36 w-full bg-slate-100 relative overflow-hidden group">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">No Cover Image</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-xs ${
                          isDisabled
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isDisabled ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        {isDisabled ? 'Disabled' : 'Active'}
                      </span>
                    </div>

                    {/* Product Count Pill */}
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                        {prodCount} {prodCount === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-slate-900">{category.name}</h3>
                      <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        /{category.slug}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] mt-1">
                      {category.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Footer Controls: Toggle Enable/Disable & Actions */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Enable / Disable Switch */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleDisabled(category)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        !isDisabled ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={!isDisabled}
                      title={isDisabled ? 'Click to Enable Category' : 'Click to Disable Category'}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          !isDisabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[11px] font-bold text-slate-600">
                      {isDisabled ? 'Disabled' : 'Enabled'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(category)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingCategory(category)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Category Modal */}
      {(isCreateModalOpen || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingCategory(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balochi Traditional, Peshawari Kaptaan"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Slug / URL Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. balochi-traditional"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-mono text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of this category cut, materials, and styling..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cover Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {formData.image && (
                    <div className="w-9 h-9 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Disabled Status Option */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Disable this Category</div>
                  <div className="text-[11px] text-slate-500">
                    When disabled, this category is marked inactive and hidden from the storefront.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, disabled: !formData.disabled })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.disabled ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={formData.disabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      formData.disabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Category?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete category <strong>"{deletingCategory.name}"</strong>? Products in this
                category will not be deleted but will become unassigned.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={submitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
