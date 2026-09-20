import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, X, RefreshCw, Trash2, Printer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { normalizeAssetUrl } from '../../utils/assetUrl';
import type { Order } from '../../types';

export const OrdersTab: React.FC = () => {
  const { settings, formatPrice } = useStoreSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'replacements'>('orders');

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Print & Delete States
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; orderNumber: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadOrders();
    const handleOrdersChanged = () => loadOrders();
    // Silent auto-refresh - quietly reloads orders list every ~9s
    const handleAutoRefresh = async () => {
      try {
        const list = await apiService.getOrders();
        setOrders(list);
      } catch {}
    };
    window.addEventListener('psh:orders-changed', handleOrdersChanged);
    window.addEventListener('psh:auto-refresh', handleAutoRefresh);
    return () => {
      window.removeEventListener('psh:orders-changed', handleOrdersChanged);
      window.removeEventListener('psh:auto-refresh', handleAutoRefresh);
    };
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const list = await apiService.getOrders();
    setOrders(list);
    setLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    const updated = await apiService.updateOrderStatus(orderId, status);
    if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderNumber === orderId)) {
      setSelectedOrder(updated);
    }
    loadOrders();
  };

  const handleModerateReplacement = async (orderId: string, approved: boolean) => {
    await apiService.moderateReplacement(orderId, approved);
    loadOrders();
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await apiService.deleteOrder(orderToDelete.id);
      if (selectedOrder && (selectedOrder.id === orderToDelete.id || selectedOrder.orderNumber === orderToDelete.orderNumber)) {
        setSelectedOrder(null);
      }
      setNotification({ type: 'success', message: `Order #${orderToDelete.orderNumber} deleted successfully.` });
      setOrderToDelete(null);
      loadOrders();
    } catch {
      setNotification({ type: 'error', message: 'Failed to delete order.' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // RFC 4180-compliant CSV: quote every string field to handle commas/spaces
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const headers = [
      'Order Number', 'Date', 'Customer Name', 'Phone',
      'City', 'Province', 'Payment Method', 'Shipping Method',
      'Items Count', 'Subtotal (Rs.)', 'Shipping Fee (Rs.)',
      'Discount (Rs.)', 'Total Payable (Rs.)', 'Status', 'Promo Code'
    ];

    const rows = orders.map(o => [
      esc(o.orderNumber),
      esc(o.date),
      esc(o.shippingAddress?.fullName ?? ''),
      esc(o.shippingAddress?.phone ?? ''),
      esc(o.shippingAddress?.city ?? ''),
      esc((o.shippingAddress as any)?.province ?? ''),
      esc(o.paymentMethod ?? ''),
      esc(o.shippingMethod ?? ''),
      o.items?.length ?? 0,
      Number(o.subtotal ?? 0).toFixed(2),
      Number(o.shippingFee ?? 0).toFixed(2),
      Number(o.discount ?? 0).toFixed(2),
      Number(o.total ?? 0).toFixed(2),
      esc(o.status),
      esc(o.promoCode ?? ''),
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `peshawari_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  const filteredOrders = orders.filter(o => {
    if (activeSubTab === 'replacements' && !o.replacementRequested) return false;
    if (search && !o.orderNumber.toLowerCase().includes(search.toLowerCase()) && !o.shippingAddress.fullName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedStatus !== 'All' && o.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Order Management & Fulfillment</h2>
          <p className="text-xs text-slate-500">Track production status, courier handovers & customer size exchange requests.</p>
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
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-md ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
                <th className="py-3 px-4">Fulfillment Status</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No orders found matching parameters.</td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
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
                      <select
                        value={order.status}
                        onChange={e => handleUpdateStatus(order.id, e.target.value as any)}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        <option value="Placed">Placed</option>
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
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setOrderToPrint(order)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Print Professional Invoice / Packing Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                          title="View Full Order Specs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setOrderToDelete({ id: order.id, orderNumber: order.orderNumber })}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrderToPrint(selectedOrder)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Print Official Order Invoice"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button
                  onClick={() => setOrderToDelete({ id: selectedOrder.id, orderNumber: selectedOrder.orderNumber })}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete Order"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                {selectedOrder.items.map(item => {
                  const imgUrl = (item.product?.images && (item.product.images.front || (Array.isArray(item.product.images.gallery) && item.product.images.gallery[0]))) || '';
                  return (
                    <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {imgUrl && (
                            <img src={imgUrl} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200" />
                          )}
                          <div>
                            <h5 className="font-semibold text-sm text-slate-900">{item.product.name}</h5>
                            <span className="text-xs text-slate-500">EU {item.size} • Color: {item.selectedColor} • Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-serif font-bold text-slate-900 text-sm">
                          {formatPrice(Number(item.product.price) * (Number(item.quantity) || 1))}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
                <p className="text-slate-600">Subtotal: {formatPrice(selectedOrder.subtotal)}</p>
                {Number(selectedOrder.discount) > 0 && (
                  <p className="text-emerald-600 font-semibold">Promo Discount: -{formatPrice(selectedOrder.discount)}</p>
                )}
                <p className="text-slate-600">Shipping Fee: {selectedOrder.shippingFee === 0 ? 'FREE' : formatPrice(selectedOrder.shippingFee)}</p>
                <p className="text-slate-900 font-serif font-bold text-base pt-1">Total: {formatPrice(selectedOrder.total)}</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Order Confirmation Dialog Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-xl text-slate-900">Delete Order Permanently?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">Order #{orderToDelete.orderNumber}</strong>? This action cannot be undone and will remove the order record from the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="btn-glass text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteOrder}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Professional Order Invoice Modal */}
      {orderToPrint && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl max-w-4xl w-full border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            {/* Modal Control Bar (Excluded from Print) */}
            <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-serif font-bold text-sm">Official Artisan Invoice Preview</h3>
                  <p className="text-[11px] text-slate-400">Ready for A4 paper print or PDF export</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn-copper text-xs py-2 px-5 flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Now (Ctrl+P)
                </button>
                <button
                  type="button"
                  onClick={() => setOrderToPrint(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Document Container */}
            <div className="overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-300/60">
              
              {/* THE PRINTABLE SHEET (Captured during window.print()) - PURE LUXURY TABLE LAYOUT, ZERO CONTAINERS */}
              <div
                id="printable-invoice-container"
                className="bg-white text-slate-900 w-full max-w-4xl p-8 sm:p-12 shadow-2xl font-sans text-xs print:p-0 print:shadow-none print:max-w-none print:w-full"
              >
                {/* Header: Logo & Store Info on Left | Invoice Metadata on Right (Pure Table) */}
                <table className="w-full border-b-2 border-slate-900 pb-5 mb-5">
                  <tbody>
                    <tr>
                      <td className="align-top pb-4">
                        {settings.logoUrl ? (
                          <img
                            src={normalizeAssetUrl(settings.logoUrl)}
                            alt={settings.storeName || 'Store Logo'}
                            className="h-14 w-auto max-w-[220px] object-contain mb-2"
                          />
                        ) : (
                          <div className="font-serif font-black text-2xl uppercase tracking-wider text-slate-900 mb-1">
                            {settings.storeName || 'PESHAWARI CHAPPAL CO.'}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <div className="text-slate-800 font-medium">Bazaar-e-Kissa Khwani, Peshawar, Khyber Pakhtunkhwa, Pakistan</div>
                          <div className="whitespace-nowrap">
                            <span>Helpline: </span>
                            <strong className="text-slate-900 font-mono whitespace-nowrap">{settings.supportPhone || '+92 91 111 222 333'}</strong>
                            <span className="mx-2 text-slate-300">|</span>
                            <span>Email: </span>
                            <strong className="text-slate-900 font-mono whitespace-nowrap">{settings.supportEmail || 'concierge@peshawarichappal.com'}</strong>
                          </div>
                          <div className="text-slate-500">Official Web: www.peshawarichappal.pk • Handcrafted Artisan Guild</div>
                        </div>
                      </td>

                      <td className="align-top text-right pb-4 whitespace-nowrap pl-6 w-72">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Commercial Tax Invoice & Packing Slip
                        </div>
                        <div className="font-mono text-2xl font-black text-slate-950 tracking-tight whitespace-nowrap my-1">
                          #{orderToPrint.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-700 space-y-0.5">
                          <div>
                            <span className="text-slate-500">Booking Date: </span>
                            <strong className="font-mono text-slate-900 whitespace-nowrap">{orderToPrint.date}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Payment Mode: </span>
                            <strong className="uppercase text-slate-900 whitespace-nowrap">{orderToPrint.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : orderToPrint.paymentMethod}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Fulfillment: </span>
                            <strong className="uppercase text-slate-900 whitespace-nowrap">{orderToPrint.status}</strong>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Customer & Shipping Details (Table Layout - No Containers) */}
                <table className="w-full border-b border-slate-300 mb-6 text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left font-bold uppercase text-[10px] tracking-wider text-slate-500 pb-2 w-1/2">
                        Customer & Delivery Destination
                      </th>
                      <th className="text-left font-bold uppercase text-[10px] tracking-wider text-slate-500 pb-2 w-1/2 pl-6">
                        Logistics & Dispatch Information
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="align-top py-3 pr-6 text-slate-800 space-y-1">
                        <div className="font-bold text-sm text-slate-950">{orderToPrint.shippingAddress.fullName}</div>
                        <div className="text-slate-700 leading-relaxed">{orderToPrint.shippingAddress.address}</div>
                        <div className="text-slate-700">{orderToPrint.shippingAddress.city}, {orderToPrint.shippingAddress.postalCode || '25000'}, {orderToPrint.shippingAddress.country}</div>
                        <div className="pt-1.5 text-slate-900 space-y-0.5">
                          <div className="whitespace-nowrap">
                            <span className="text-slate-500">Phone: </span>
                            <strong className="font-mono text-slate-950 whitespace-nowrap">{orderToPrint.shippingAddress.phone}</strong>
                          </div>
                          <div className="whitespace-nowrap">
                            <span className="text-slate-500">Email: </span>
                            <span className="font-mono text-slate-700 whitespace-nowrap">{orderToPrint.shippingAddress.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="align-top py-3 pl-6 border-l border-slate-200 text-slate-800">
                        <table className="w-full text-xs">
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="py-1 text-slate-500 whitespace-nowrap pr-2 w-32">Shipping Service:</td>
                              <td className="py-1 font-semibold text-slate-950 whitespace-nowrap">
                                {orderToPrint.shippingMethod === 'express' ? 'Express Air Courier (1-2 Days)' : 'Standard Overland Courier (3-5 Days)'}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1 text-slate-500 whitespace-nowrap pr-2">Origin Depot:</td>
                              <td className="py-1 text-slate-800 whitespace-nowrap">Peshawar Central Heritage Hub</td>
                            </tr>
                            <tr>
                              <td className="py-1 text-slate-500 whitespace-nowrap pr-2">Packaging:</td>
                              <td className="py-1 text-slate-800 whitespace-nowrap">Custom Wooden Artisan Box + Dust Bag</td>
                            </tr>
                            <tr>
                              <td className="py-1 text-slate-500 whitespace-nowrap pr-2">Guarantee:</td>
                              <td className="py-1 text-emerald-800 font-semibold whitespace-nowrap">100% Genuine Leather Insured</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Items Manifest (Pristine Edge-to-Edge Table - No Container) */}
                <table className="w-full text-left text-xs mb-6 border-collapse">
                  <thead>
                    <tr className="border-t-2 border-b-2 border-slate-900 text-slate-900 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                      <th className="py-2.5 px-3 text-center w-10 whitespace-nowrap">#</th>
                      <th className="py-2.5 px-3">Article Description</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Leather Tone</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Size (EU)</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Qty</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Unit Price</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orderToPrint.items.map((item, idx) => {
                      const unitPrice = Number(item.product?.price) || 0;
                      const lineTotal = unitPrice * (Number(item.quantity) || 1);
                      const imgUrl = (item.product?.images && (item.product.images.front || (Array.isArray(item.product.images.gallery) && item.product.images.gallery[0]))) || '';
                      const colorDisplay = (item.selectedColor || 'saddle-tan').toString().replace(/-/g, ' ');

                      return (
                        <tr key={item.id || idx}>
                          <td className="py-3 px-3 text-center text-slate-400 font-mono whitespace-nowrap">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              {imgUrl && (
                                <img
                                  src={imgUrl}
                                  alt={item.product?.name}
                                  className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0 bg-white"
                                />
                              )}
                              <div>
                                <div className="font-bold text-slate-950 text-xs">{item.product?.name}</div>
                                <div className="text-[10px] text-slate-500">Hand-stitched Tyre Sole • Premium Full-grain</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 capitalize text-slate-800 whitespace-nowrap">{colorDisplay}</td>
                          <td className="py-3 px-3 text-center font-bold text-slate-950 whitespace-nowrap">EU {item.size}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-950 whitespace-nowrap">{item.quantity}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-800 whitespace-nowrap">{formatPrice(unitPrice)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-950 whitespace-nowrap">{formatPrice(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Financial Summary & Artisan Seal (Table Layout - No Containers) */}
                <table className="w-full text-xs mb-8">
                  <tbody>
                    <tr className="align-top">
                      <td className="w-1/2 pr-6 text-slate-600 space-y-2">
                        <div className="border-l-2 border-slate-900 pl-3 space-y-1">
                          <div className="font-bold text-slate-950 text-[11px] uppercase tracking-wider">
                            Certified Master Craftsman Authenticity
                          </div>
                          <p className="text-[10px] text-slate-600 leading-relaxed">
                            Handcrafted in Peshawar using authentic tire soles, vegetable-tanned full-grain leather, and solid brass buckles.
                          </p>
                        </div>
                        <div className="text-[10px] text-slate-500 italic pl-3">
                          * Eligible for 7-day doorstep size replacement if fitting requires adjustment.
                        </div>
                      </td>

                      <td className="w-1/2 pl-6">
                        <table className="w-full text-xs">
                          <tbody>
                            <tr>
                              <td className="py-1 text-slate-600 whitespace-nowrap">Gross Subtotal:</td>
                              <td className="py-1 text-right font-mono text-slate-900 whitespace-nowrap">{formatPrice(orderToPrint.subtotal)}</td>
                            </tr>
                            {Number(orderToPrint.discount) > 0 && (
                              <tr>
                                <td className="py-1 text-emerald-700 whitespace-nowrap">
                                  Promo Discount {orderToPrint.promoCode ? `(${orderToPrint.promoCode})` : ''}:
                                </td>
                                <td className="py-1 text-right font-mono font-semibold text-emerald-700 whitespace-nowrap">
                                  -{formatPrice(orderToPrint.discount)}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td className="py-1 text-slate-600 whitespace-nowrap">Nationwide Delivery:</td>
                              <td className="py-1 text-right font-mono text-slate-900 whitespace-nowrap">
                                {orderToPrint.shippingFee === 0 ? <strong className="text-emerald-700">FREE</strong> : formatPrice(orderToPrint.shippingFee)}
                              </td>
                            </tr>
                            <tr className="border-t-2 border-b-2 border-slate-900">
                              <td className="py-2.5 font-bold text-sm text-slate-950 uppercase tracking-wider whitespace-nowrap">
                                Total Payable:
                              </td>
                              <td className="py-2.5 text-right font-mono font-black text-lg text-slate-950 whitespace-nowrap">
                                {formatPrice(orderToPrint.total)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Official Sign-off & Stamp Footer (Pure Table) */}
                <table className="w-full pt-6 border-t border-slate-300 text-[11px] text-slate-500">
                  <tbody>
                    <tr>
                      <td className="align-middle">
                        <div className="font-semibold text-slate-800">Thank you for supporting traditional Pakistani artisan craftsmanship!</div>
                        <div>Computer-generated tax invoice. No physical signature required for courier dispatch.</div>
                      </td>
                      <td className="align-middle text-right whitespace-nowrap">
                        <div className="inline-block border-b border-slate-400 pb-1 px-6 text-center">
                          <span className="italic font-serif text-slate-800 text-xs font-semibold whitespace-nowrap">Peshawari Quality Checked</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">Authorized Artisan Fulfillment Hub</div>
                      </td>
                    </tr>
                  </tbody>
                </table>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Global Print Media Style Injection */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-container, #printable-invoice-container * {
            visibility: visible !important;
          }
          #printable-invoice-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            z-index: 999999 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
};
