import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, Eye, Check, X, RefreshCw, Truck, Clock, ShieldCheck } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Order } from '../../types';

export const OrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<'All' | 'customized' | 'standard'>('All');
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'replacements'>('orders');

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const list = await apiService.getOrders();
    setOrders(list);
    setLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    const updated = await apiService.updateOrderStatus(orderId, status);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(updated);
    }
    loadOrders();
  };

  const handleModerateReplacement = async (orderId: string, approved: boolean) => {
    await apiService.moderateReplacement(orderId, approved);
    loadOrders();
  };

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Email', 'Items Count', 'Status', 'Is Customized', 'Total Payable'];
    const rows = orders.map(o => [
      o.orderNumber,
      o.date,
      `"${o.shippingAddress.fullName}"`,
      o.shippingAddress.email,
      o.items.length,
      o.status,
      o.isCustomizedOrder ? 'Yes' : 'No',
      `$${o.total}`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `peshawari_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter(o => {
    if (activeSubTab === 'replacements' && !o.replacementRequested) return false;
    if (search && !o.orderNumber.toLowerCase().includes(search.toLowerCase()) && !o.shippingAddress.fullName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedStatus !== 'All' && o.status !== selectedStatus) {
      return false;
    }
    if (selectedType === 'customized' && !o.isCustomizedOrder) return false;
    if (selectedType === 'standard' && o.isCustomizedOrder) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Order Management & Fulfillment</h2>
          <p className="text-xs text-slate-500">Track production status, custom 3D specs, courier handovers & exchanges.</p>
        </div>

        <button onClick={handleExportCSV} className="btn-copper text-xs py-2 px-5 flex items-center gap-2">
          <Download className="w-4 h-4" /> Export Orders to CSV
        </button>
      </div>

      {/* Sub Tab Selection Pills */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeSubTab === 'orders'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveSubTab('replacements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
            activeSubTab === 'replacements'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Size Exchange Requests ({orders.filter(o => o.replacementRequested).length})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID (PSH-89210) or customer name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Statuses</option>
            <option value="Placed">Placed</option>
            <option value="Crafting">Crafting</option>
            <option value="Quality Check">Quality Check</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Order Types</option>
            <option value="customized">Bespoke 3D Customized</option>
            <option value="standard">Standard Catalog</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Info</th>
                <th className="py-3 px-4">Order Details</th>
                <th className="py-3 px-4">Customized?</th>
                <th className="py-3 px-4">Fulfillment Status</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No orders found matching parameters.</td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-serif font-bold text-slate-900">{order.orderNumber}</td>
                    <td className="py-3 px-4 text-slate-500">{order.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{order.shippingAddress.fullName}</div>
                      <div className="text-[10px] text-slate-500">{order.shippingAddress.city}, {order.shippingAddress.country}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="py-3 px-4">
                      {order.isCustomizedOrder ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold">
                          3D Custom
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={e => handleUpdateStatus(order.id, e.target.value as any)}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      >
                        <option value="Placed">Placed</option>
                        <option value="Crafting">Crafting</option>
                        <option value="Quality Check">Quality Check</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      {order.replacementRequested && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                          <RefreshCw className="w-3 h-3" /> Exchange ({order.replacementStatus})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-serif font-bold text-slate-900 text-sm">
                      Rs. {order.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-600 transition-colors" title="View Full Order Specs">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail View Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] uppercase font-bold text-blue-600 block">Order Specification</span>
                <h3 className="font-serif font-bold text-2xl text-slate-900">{selectedOrder.orderNumber}</h3>
                <span className="text-xs text-slate-500">Placed on {selectedOrder.date}</span>
              </div>

              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Replacement Banner if active */}
            {selectedOrder.replacementRequested && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <RefreshCw className="w-4 h-4" /> Customer Requested Size Exchange
                  </span>
                  <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-800">
                    Status: {selectedOrder.replacementStatus}
                  </span>
                </div>
                <p className="text-slate-600"><strong>Reason:</strong> "{selectedOrder.replacementReason || 'Fit adjustment required.'}"</p>
                
                {selectedOrder.replacementStatus === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleModerateReplacement(selectedOrder.id, true)} className="px-3 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700">
                      Approve Replacement
                    </button>
                    <button onClick={() => handleModerateReplacement(selectedOrder.id, false)} className="px-3 py-1 bg-rose-600 text-white rounded font-bold hover:bg-rose-700">
                      Reject Request
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Items Manifest */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-base text-slate-900">Ordered Items Manifest</h4>

              <div className="space-y-3">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={item.product.images.front} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover bg-white" />
                        <div>
                          <h5 className="font-semibold text-sm text-slate-900">{item.product.name}</h5>
                          <span className="text-xs text-slate-500">EU {item.size} • Color: {item.selectedColor} • Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-serif font-bold text-slate-900 text-sm">
                        Rs. {((item.customizationDetails ? item.customizationDetails.customPrice : item.product.price) * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    {/* Custom 3D Specifications */}
                    {item.customizationDetails && (
                      <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-900 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div><strong className="block text-[10px] text-blue-600 uppercase">Leather Shade</strong> {item.customizationDetails.leatherColor}</div>
                        <div><strong className="block text-[10px] text-blue-600 uppercase">Outsole Type</strong> {item.customizationDetails.soleType}</div>
                        <div><strong className="block text-[10px] text-blue-600 uppercase">Buckle Finish</strong> {item.customizationDetails.buckleFinish}</div>
                        <div><strong className="block text-[10px] text-blue-600 uppercase">Gold Monogram</strong> {item.customizationDetails.initials || 'None'}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Address & Payment Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-200">
              <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h5 className="font-bold text-slate-900 text-sm pb-1 border-b border-slate-200 mb-1">Customer & Address</h5>
                <p className="font-semibold text-slate-900">{selectedOrder.shippingAddress.fullName}</p>
                <p className="text-slate-600">{selectedOrder.shippingAddress.address}</p>
                <p className="text-slate-600">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                <p className="text-slate-600">{selectedOrder.shippingAddress.country}</p>
                <p className="text-blue-600 font-semibold pt-1">Phone: {selectedOrder.shippingAddress.phone}</p>
              </div>

              <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h5 className="font-bold text-slate-900 text-sm pb-1 border-b border-slate-200 mb-1">Payment & Shipping</h5>
                <p className="text-slate-600">Payment Method: <strong className="text-slate-900 uppercase">{selectedOrder.paymentMethod}</strong></p>
                <p className="text-slate-600">Shipping Option: <strong className="text-slate-900 uppercase">{selectedOrder.shippingMethod}</strong></p>
                <p className="text-slate-600">Subtotal: Rs. {selectedOrder.subtotal.toLocaleString()}</p>
                <p className="text-slate-600">Shipping Fee: Rs. {selectedOrder.shippingFee.toLocaleString()}</p>
                <p className="text-slate-900 font-serif font-bold text-base pt-1">Total: Rs. {selectedOrder.total.toLocaleString()}</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
