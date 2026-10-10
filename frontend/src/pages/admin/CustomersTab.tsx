import React, { useState, useEffect } from 'react';
import { Search, Eye, UserX, UserCheck, X, Trash2, CheckCircle2, AlertCircle, UserPlus, MessageCircle, Crown, Sparkles, Filter, Database, ShieldAlert } from 'lucide-react';
import { apiService } from '../../services/api';
import type { AdminCustomer } from '../../types/admin';

export const CustomersTab: React.FC = () => {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add customer modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    customerType: 'Permanent Buyer',
    notes: '',
    address: '',
    city: 'Peshawar',
  });

  // Heritage Club WhatsApp List Modal
  const [showHeritageModal, setShowHeritageModal] = useState(false);
  const [heritageMembers, setHeritageMembers] = useState<Array<{ id: string; whatsapp: string; name?: string; promoCode: string; createdAt: string }>>([]);
  const [loadingHeritage, setLoadingHeritage] = useState(false);

  // Clear demo data modal
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeOpts, setPurgeOpts] = useState({
    clearOrders: true,
    clearReviews: true,
    clearMessages: true,
  });

  useEffect(() => {
    loadCustomers();

    const handleCustomersChanged = () => {
      loadCustomers();
    };
    window.addEventListener('psh:customers-changed', handleCustomersChanged);
    return () => {
      window.removeEventListener('psh:customers-changed', handleCustomersChanged);
    };
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    const list = await apiService.getAdminCustomers();
    setCustomers(list);
    setLoading(false);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleStatus = async (id: string, newStatus: 'active' | 'flagged' | 'blocked') => {
    await apiService.toggleCustomerStatus(id, newStatus);
    loadCustomers();
    if (selectedCustomer && selectedCustomer.id === id) {
      setSelectedCustomer({ ...selectedCustomer, status: newStatus });
    }
    showToast('success', `Customer status updated to ${newStatus}.`);
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove customer record "${name}"?`)) {
      return;
    }
    await apiService.deleteCustomer(id);
    if (selectedCustomer && selectedCustomer.id === id) {
      setSelectedCustomer(null);
    }
    loadCustomers();
    showToast('success', `Customer "${name}" removed successfully.`);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      showToast('error', 'Name, email, and phone are required.');
      return;
    }
    setIsSaving(true);
    try {
      await apiService.registerCustomer({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        whatsapp: (formData.whatsapp || formData.phone).trim(),
        customerType: formData.customerType,
        notes: formData.notes.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
      });
      showToast('success', `${formData.customerType} "${formData.name.trim()}" added to MongoDB.`);
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        whatsapp: '',
        customerType: 'Permanent Buyer',
        notes: '',
        address: '',
        city: 'Peshawar',
      });
      loadCustomers();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save customer.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadHeritageMembers = async () => {
    setLoadingHeritage(true);
    setShowHeritageModal(true);
    try {
      const data = await apiService.getHeritageClubMembers();
      setHeritageMembers(data);
    } catch {
      setHeritageMembers([]);
    } finally {
      setLoadingHeritage(false);
    }
  };

  const handleExecutePurge = async () => {
    setIsPurging(true);
    try {
      const res = await apiService.clearDemoData(purgeOpts);
      if (res.success) {
        showToast('success', res.message || 'Demo data successfully purged from database.');
        setShowPurgeModal(false);
      } else {
        showToast('error', res.message || 'Purge failed.');
      }
    } catch {
      showToast('error', 'Failed to purge demo data.');
    } finally {
      setIsPurging(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (
      search &&
      !c.name.toLowerCase().includes(search.toLowerCase()) &&
      !c.email.toLowerCase().includes(search.toLowerCase()) &&
      !c.phone.toLowerCase().includes(search.toLowerCase()) &&
      !(c.whatsapp || '').toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (selectedType !== 'all') {
      const type = (c.customerType || 'Regular Buyer').toLowerCase();
      if (selectedType.toLowerCase() !== type) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Buyer &amp; Customer Directory</h2>
          <p className="text-xs text-slate-500">
            Permanent buyers, company directors, VIP patrons, and store shoppers saved in MongoDB Atlas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Buyer / Director</span>
          </button>

          <button
            onClick={loadHeritageMembers}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-emerald-800 border border-[#25D366]/30 text-xs font-bold transition-all cursor-pointer"
            title="View WhatsApp Heritage Club members"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>Heritage WhatsApp Club</span>
          </button>

          <button
            onClick={() => setShowPurgeModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
            title="Purge old demo reviews, orders & messages"
          >
            <Database className="w-4 h-4" />
            <span>Purge Demo Data</span>
          </button>
        </div>
      </div>

      {/* Search Input, Type Filters & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="max-w-xs w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, WhatsApp..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {[
              { id: 'all', label: 'All' },
              { id: 'permanent buyer', label: 'Permanent Buyers' },
              { id: 'director', label: 'Directors' },
              { id: 'vip patron', label: 'VIP' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredCustomers.length}</span> of {customers.length} records
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Customer / Buyer</th>
                <th className="py-3 px-4">Role / Type</th>
                <th className="py-3 px-4">Contact &amp; WhatsApp</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Last Order</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading customer records from MongoDB...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No customer records matching this filter.</td>
                </tr>
              ) : (
                filteredCustomers.map(cust => {
                  const custType = cust.customerType || 'Regular Buyer';
                  const waNumber = (cust.whatsapp || cust.phone || '').replace(/[^0-9]/g, '');
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{cust.name}</div>
                        {cust.notes && <div className="text-[10px] text-slate-400 italic line-clamp-1">{cust.notes}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          custType === 'Director'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : custType === 'Permanent Buyer'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : custType === 'VIP Patron'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {custType === 'Director' && <Crown className="w-3 h-3 text-amber-600" />}
                          {custType === 'Permanent Buyer' && <Sparkles className="w-3 h-3 text-purple-600" />}
                          <span>{custType}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{cust.email}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500 font-mono">{cust.whatsapp || cust.phone}</span>
                          {waNumber && (
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#25D366] hover:text-[#20ba5c] transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{cust.totalOrders} orders</td>
                      <td className="py-3 px-4 font-serif font-bold text-slate-900">Rs. {cust.totalSpend.toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-500">{cust.lastOrderDate}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          cust.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : cust.status === 'flagged'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}>
                          {cust.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                          title="View Customer Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {cust.status === 'active' ? (
                          <button
                            onClick={() => handleToggleStatus(cust.id, 'flagged')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-amber-600 transition-colors cursor-pointer"
                            title="Flag Account"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(cust.id, 'active')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
                            title="Reactivate Account"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                          className="p-1.5 rounded-lg border transition-colors shadow-2xs hover:scale-105 cursor-pointer"
                          style={{ color: '#DC2626', backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }}
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: '#DC2626', stroke: '#DC2626' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer / Permanent Buyer / Director Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Add Customer / Buyer / Director</h3>
                  <p className="text-[11px] text-slate-500">Stored in MongoDB Atlas `customers` collection</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Haji Asad Ullah"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Role / Type *</label>
                  <select
                    value={formData.customerType}
                    onChange={e => setFormData({ ...formData, customerType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="Permanent Buyer">Permanent Buyer</option>
                    <option value="Director">Director</option>
                    <option value="VIP Patron">VIP Patron</option>
                    <option value="Regular Buyer">Regular Buyer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. asad@peshawar.pk"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0300 1234567"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value, whatsapp: formData.whatsapp || e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">WhatsApp Number (for broadcasts)</label>
                <input
                  type="tel"
                  placeholder="0300 1234567"
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    placeholder="Street / Office Address"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Peshawar, Islamabad..."
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes / Preferences</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prefers Zalmi Mustard size 9, high-volume seasonal buyer"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Heritage Club WhatsApp List Modal */}
      {showHeritageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Heritage Club WhatsApp Broadcast List</h3>
                  <p className="text-[11px] text-slate-500">
                    Subscribers who joined via the store footer to receive drops &amp; promos (`heritage_club` table).
                  </p>
                </div>
              </div>
              <button onClick={() => setShowHeritageModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHeritage ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading broadcast list...</div>
            ) : heritageMembers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No subscribers have joined the Heritage Club via WhatsApp yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/40">
                {heritageMembers.map(m => (
                  <div key={m.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-white">
                    <div>
                      <div className="font-mono font-bold text-xs text-slate-900">{m.whatsapp}</div>
                      <div className="text-[10px] text-slate-400">
                        Joined: {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Recent'} • Code: {m.promoCode}
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/${m.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5c] text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <span>All members received welcome code: <strong>HERITAGE10</strong> (10% OFF).</span>
              <button
                onClick={() => {
                  const numbers = heritageMembers.map(m => m.whatsapp).join(', ');
                  navigator.clipboard.writeText(numbers);
                  showToast('success', 'WhatsApp numbers copied to clipboard for broadcast!');
                }}
                className="text-[11px] font-bold text-emerald-700 underline cursor-pointer"
              >
                Copy All Numbers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge Demo Data Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Purge Old Demo Data</h3>
                <p className="text-[11px] text-slate-500">Remove test/mock data from MongoDB Atlas</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select which old demo records you want to delete permanently from MongoDB Atlas:
            </p>

            <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={purgeOpts.clearOrders}
                  onChange={e => setPurgeOpts({ ...purgeOpts, clearOrders: e.target.checked })}
                  className="rounded text-rose-600"
                />
                <span>Clear demo orders (`orders` table)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={purgeOpts.clearReviews}
                  onChange={e => setPurgeOpts({ ...purgeOpts, clearReviews: e.target.checked })}
                  className="rounded text-rose-600"
                />
                <span>Clear demo reviews (`reviews` table)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={purgeOpts.clearMessages}
                  onChange={e => setPurgeOpts({ ...purgeOpts, clearMessages: e.target.checked })}
                  className="rounded text-rose-600"
                />
                <span>Clear demo customer messages (`messages` table)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurging || (!purgeOpts.clearOrders && !purgeOpts.clearReviews && !purgeOpts.clearMessages)}
                onClick={handleExecutePurge}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isPurging ? 'Purging...' : 'Delete Selected Demo Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 border border-blue-200 font-serif font-bold text-xl flex items-center justify-center">
                  {selectedCustomer.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-xl text-slate-900">{selectedCustomer.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedCustomer.customerType || 'Customer'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{selectedCustomer.email} • Joined {selectedCustomer.joinDate}</span>
                </div>
              </div>

              <button onClick={() => setSelectedCustomer(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 uppercase block text-[10px]">Total Orders</span>
                <span className="font-serif font-bold text-lg text-slate-900">{selectedCustomer.totalOrders}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 uppercase block text-[10px]">Total Lifetime Spend</span>
                <span className="font-serif font-bold text-lg text-blue-600">Rs. {selectedCustomer.totalSpend.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 uppercase block text-[10px]">Wishlist Items</span>
                <span className="font-serif font-bold text-lg text-slate-900">{selectedCustomer.wishlistCount || 0} Items</span>
              </div>
            </div>

            {/* Direct WhatsApp Contact Button */}
            {selectedCustomer.phone && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Direct WhatsApp Line</span>
                  <span className="text-xs font-mono font-bold text-emerald-900">{selectedCustomer.whatsapp || selectedCustomer.phone}</span>
                </div>
                <a
                  href={`https://wa.me/${(selectedCustomer.whatsapp || selectedCustomer.phone).replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5c] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            )}

            {/* Saved Addresses */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-slate-900">Saved Delivery Addresses</h4>
              {selectedCustomer.savedAddresses.length === 0 ? (
                <p className="text-xs text-slate-400">No saved addresses found.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedCustomer.savedAddresses.map((addr, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      {addr}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Management & Delete */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                Account Moderation Status: <strong className="uppercase">{selectedCustomer.status}</strong>
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleStatus(selectedCustomer.id, selectedCustomer.status === 'blocked' ? 'active' : 'blocked')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    selectedCustomer.status === 'blocked' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {selectedCustomer.status === 'blocked' ? 'Unblock Account' : 'Block Account'}
                </button>

                <button
                  onClick={() => handleDeleteCustomer(selectedCustomer.id, selectedCustomer.name)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-rose-50 text-rose-600 border border-rose-200 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
