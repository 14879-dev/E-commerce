import React, { useState, useEffect } from 'react';
import { Search, Eye, UserX, UserCheck, X, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import type { AdminCustomer } from '../../types/admin';

export const CustomersTab: React.FC = () => {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const filteredCustomers = customers.filter(c => {
    if (
      search &&
      !c.name.toLowerCase().includes(search.toLowerCase()) &&
      !c.email.toLowerCase().includes(search.toLowerCase()) &&
      !c.phone.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
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
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Buyer & Customer Directory</h2>
          <p className="text-xs text-slate-500">
            Customer contact details, delivery addresses, order histories, and lifetime spend compiled from store orders.
          </p>
        </div>
      </div>

      {/* Search Input & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-md w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by buyer name, email, or phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredCustomers.length}</span> of {customers.length} buyers
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Buyer Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">First Order</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Total Spend</th>
                <th className="py-3 px-4">Last Order</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading customer records...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No customer records found.</td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{cust.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{cust.email}</div>
                      <div className="text-[10px] text-slate-400">{cust.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{cust.joinDate}</td>
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
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-600 transition-colors"
                        title="View Customer Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {cust.status === 'active' ? (
                        <button
                          onClick={() => handleToggleStatus(cust.id, 'flagged')}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-amber-600 transition-colors"
                          title="Flag Account"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(cust.id, 'active')}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-emerald-600 transition-colors"
                          title="Reactivate Account"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  <h3 className="font-serif font-bold text-xl text-slate-900">{selectedCustomer.name}</h3>
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
                <span className="text-slate-500 uppercase block text-[10px]">Total Orders</span>
                <span className="font-serif font-bold text-lg text-slate-900">{selectedCustomer.orderCount} Orders</span>
              </div>
            </div>

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
