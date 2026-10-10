import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, X, RefreshCw, Trash2, Printer, AlertTriangle, CheckCircle2, Plus, ShoppingBag, User, CreditCard, PackagePlus } from 'lucide-react';
import { apiService } from '../../services/api';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { normalizeAssetUrl } from '../../utils/assetUrl';
import type { Order, Product, CartItem } from '../../types';

interface ManualOrderItem {
  productId: string;
  size: number;
  selectedColor: string;
  quantity: number;
  unitPrice: number;
}

export const OrdersTab: React.FC = () => {
  const { settings, formatPrice } = useStoreSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'replacements'>('orders');

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Manual Order Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [manualOrderError, setManualOrderError] = useState<string | null>(null);

  // Manual Order Form Fields
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCity, setCustCity] = useState('Peshawar');
  const [custPostal, setCustPostal] = useState('25000');
  const [custPayment, setCustPayment] = useState<'cod' | 'card' | 'jazzcash' | 'easypaisa'>('cod');
  const [custShipping, setCustShipping] = useState<'standard' | 'express' | 'artisan-courier'>('standard');
  const [custShippingFee, setCustShippingFee] = useState<number>(0);
  const [custDiscount, setCustDiscount] = useState<number>(0);
  const [custPromoCode, setCustPromoCode] = useState('');
  const [custStatus, setCustStatus] = useState<'Placed' | 'Shipped' | 'Delivered'>('Placed');
  const [manualItems, setManualItems] = useState<ManualOrderItem[]>([
    { productId: '', size: 9, selectedColor: 'saddle-tan', quantity: 1, unitPrice: 0 }
  ]);

  // Print & Delete States
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; orderNumber: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadOrders();
    apiService.getProducts().then(prods => {
      setAllProducts(prods);
      if (prods.length > 0) {
        setManualItems([
          {
            productId: prods[0].id,
            size: prods[0].availableSizes?.[0] || 9,
            selectedColor: prods[0].availableColors?.[0] || 'saddle-tan',
            quantity: 1,
            unitPrice: prods[0].price,
          }
        ]);
      }
    });

    const handleOrdersChanged = () => loadOrders();
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

  const handleAddManualItem = () => {
    const firstProd = allProducts[0];
    setManualItems(prev => [
      ...prev,
      {
        productId: firstProd ? firstProd.id : '',
        size: firstProd?.availableSizes?.[0] || 9,
        selectedColor: firstProd?.availableColors?.[0] || 'saddle-tan',
        quantity: 1,
        unitPrice: firstProd ? firstProd.price : 0,
      }
    ]);
  };

  const handleRemoveManualItem = (index: number) => {
    if (manualItems.length <= 1) return;
    setManualItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateManualItem = (index: number, field: keyof ManualOrderItem, val: any) => {
    setManualItems(prev => {
      const copy = [...prev];
      const current = { ...copy[index], [field]: val };
      if (field === 'productId') {
        const prod = allProducts.find(p => p.id === val);
        if (prod) {
          current.unitPrice = prod.price;
          current.size = prod.availableSizes?.[0] || 9;
          current.selectedColor = prod.availableColors?.[0] || 'saddle-tan';
        }
      }
      copy[index] = current;
      return copy;
    });
  };

  const manualSubtotal = manualItems.reduce((acc, item) => acc + (Number(item.unitPrice || 0) * Number(item.quantity || 1)), 0);
  const manualTotal = Math.max(0, manualSubtotal + Number(custShippingFee || 0) - Number(custDiscount || 0));

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualOrderError(null);

    if (!custName.trim()) {
      setManualOrderError('Customer full name is required');
      return;
    }
    if (!custPhone.trim()) {
      setManualOrderError('Customer phone number is required');
      return;
    }
    if (!custAddress.trim()) {
      setManualOrderError('Delivery address is required');
      return;
    }
    if (!custCity.trim()) {
      setManualOrderError('City is required');
      return;
    }

    const validItems: CartItem[] = [];
    for (let i = 0; i < manualItems.length; i++) {
      const item = manualItems[i];
      const prod = allProducts.find(p => p.id === item.productId);
      if (!prod) {
        setManualOrderError(`Please select a valid product for Item #${i + 1}`);
        return;
      }
      validItems.push({
        id: `item-${Date.now()}-${i}`,
        product: { ...prod, price: Number(item.unitPrice || prod.price) },
        size: item.size,
        selectedColor: item.selectedColor,
        quantity: Math.max(1, Number(item.quantity || 1)),
      });
    }

    if (validItems.length === 0) {
      setManualOrderError('At least one product item must be added');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderPayload: Omit<Order, 'id' | 'orderNumber' | 'date' | 'status' | 'trackingSteps'> & { status?: Order['status'] } = {
        items: validItems,
        shippingAddress: {
          fullName: custName.trim(),
          email: custEmail.trim() || 'customer@order.manual',
          phone: custPhone.trim(),
          address: custAddress.trim(),
          city: custCity.trim(),
          postalCode: custPostal.trim() || '25000',
          country: 'Pakistan',
        },
        shippingMethod: custShipping,
        paymentMethod: custPayment,
        subtotal: manualSubtotal,
        shippingFee: Number(custShippingFee || 0),
        discount: Number(custDiscount || 0),
        total: manualTotal,
        status: custStatus,
        promoCode: custPromoCode.trim() || undefined,
      };

      const created = await apiService.createOrder(orderPayload);
      setNotification({ type: 'success', message: `Manual Order #${created.orderNumber} successfully created!` });
      setShowCreateModal(false);
      // Reset form
      setCustName('');
      setCustPhone('');
      setCustEmail('');
      setCustAddress('');
      setCustDiscount(0);
      setCustPromoCode('');
      setCustShippingFee(0);
      setCustStatus('Placed');
      if (allProducts.length > 0) {
        setManualItems([
          {
            productId: allProducts[0].id,
            size: allProducts[0].availableSizes?.[0] || 9,
            selectedColor: allProducts[0].availableColors?.[0] || 'saddle-tan',
            quantity: 1,
            unitPrice: allProducts[0].price,
          }
        ]);
      }
      loadOrders();
    } catch (err: any) {
      setManualOrderError(err.message || 'Failed to create manual order');
    } finally {
      setIsSubmittingOrder(false);
      setTimeout(() => setNotification(null), 4000);
    }
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
          <p className="text-xs text-slate-500">Track production status, courier handovers, add manual customer orders & handle size exchanges.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-copper text-xs py-2.5 px-4 flex items-center gap-2 font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" /> + Create Manual Order
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl border border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-700 flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-700" /> Export CSV
          </button>
        </div>
      </div>

      {/* Sub Tab Selection Pills */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeSubTab === 'orders'
              ? 'bg-[#565449] text-[#F7F4EB] border-[#565449] shadow-xs'
              : 'bg-[#A0988A]/20 text-[#1A1A18] border-[#565449]/20 hover:bg-[#A0988A]/30'
          }`}
        >
          All Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveSubTab('replacements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
            activeSubTab === 'replacements'
              ? 'bg-[#565449] text-[#F7F4EB] border-[#565449] shadow-xs'
              : 'bg-[#A0988A]/20 text-[#1A1A18] border-[#565449]/20 hover:bg-[#A0988A]/30'
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
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          order.status === 'Delivered' ? 'bg-emerald-600' :
                          order.status === 'Shipped' ? 'bg-blue-600' :
                          order.status === 'Cancelled' ? 'bg-red-600' :
                          'bg-amber-500'
                        }`} />
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
                      </div>

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
                          className="p-1.5 rounded-lg border transition-colors cursor-pointer shadow-2xs hover:scale-105"
                          style={{ color: '#DC2626', backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }}
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: '#DC2626', stroke: '#DC2626' }} />
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
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="font-serif font-bold text-2xl text-slate-900">{selectedOrder.orderNumber}</h3>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    selectedOrder.status === 'Delivered'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : selectedOrder.status === 'Shipped'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : selectedOrder.status === 'Cancelled'
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      selectedOrder.status === 'Delivered' ? 'bg-emerald-600' :
                      selectedOrder.status === 'Shipped' ? 'bg-blue-600' :
                      selectedOrder.status === 'Cancelled' ? 'bg-rose-600' :
                      'bg-amber-500'
                    }`} />
                    {selectedOrder.status}
                  </span>
                </div>
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
                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  style={{ color: '#DC2626', backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }}
                  title="Delete Order"
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: '#DC2626', stroke: '#DC2626' }} /> Delete
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
                            <span className="text-xs text-slate-500">Size {item.size} • Color: {item.selectedColor} • Qty: {item.quantity}</span>
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
                <p className="text-blue-600 font-semibold pt-1">Phone: {selectedOrder.shippingAddress.phone}</p>
                {selectedOrder.shippingAddress.whatsapp && (
                  <p className="text-emerald-700 font-semibold flex items-center gap-1.5 pt-0.5">
                    <span>WhatsApp: {selectedOrder.shippingAddress.whatsapp}</span>
                    <a
                      href={`https://wa.me/${selectedOrder.shippingAddress.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold inline-block"
                    >
                      Open Chat →
                    </a>
                  </p>
                )}
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
                          {orderToPrint.shippingAddress.whatsapp && (
                            <div className="whitespace-nowrap">
                              <span className="text-slate-500">WhatsApp: </span>
                              <strong className="font-mono text-emerald-800 whitespace-nowrap">{orderToPrint.shippingAddress.whatsapp}</strong>
                            </div>
                          )}
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
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Size</th>
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
                          <td className="py-3 px-3 text-center font-bold text-slate-950 whitespace-nowrap">Size {item.size}</td>
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

      {/* Manual Customer Order Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">Create Manual Customer Order</h3>
                  <p className="text-[11px] text-slate-500">Record phone, WhatsApp, or in-person orders into the fulfillment queue.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleCreateManualOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
              {manualOrderError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{manualOrderError}</span>
                </div>
              )}

              {/* 1. Customer Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" /> Customer Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={custName}
                      onChange={e => setCustName(e.target.value)}
                      placeholder="e.g. Tariq Khan"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (WhatsApp/COD) *</label>
                    <input
                      type="text"
                      required
                      value={custPhone}
                      onChange={e => setCustPhone(e.target.value)}
                      placeholder="e.g. 03001234567"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Street Address *</label>
                    <input
                      type="text"
                      required
                      value={custAddress}
                      onChange={e => setCustAddress(e.target.value)}
                      placeholder="House/Shop #, Street, Sector, Area..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={custCity}
                      onChange={e => setCustCity(e.target.value)}
                      placeholder="Peshawar, Lahore, etc."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={custEmail}
                      onChange={e => setCustEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={custPostal}
                      onChange={e => setCustPostal(e.target.value)}
                      placeholder="e.g. 25000"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Order Items */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-600" /> Order Items ({manualItems.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product
                  </button>
                </div>

                <div className="space-y-3">
                  {manualItems.map((item, idx) => {
                    const selectedProd = allProducts.find(p => p.id === item.productId);
                    const sizes = selectedProd?.availableSizes || [7, 8, 9, 10, 11, 12, 13];
                    const colors = selectedProd?.availableColors || ['saddle-tan', 'espresso', 'midnight-black', 'vintage-tan'];

                    return (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-500">Item #{idx + 1}</span>
                          {manualItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveManualItem(idx)}
                              className="text-[11px] font-bold text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          {/* Product Dropdown */}
                          <div className="sm:col-span-6">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Product</label>
                            <select
                              value={item.productId}
                              onChange={e => handleUpdateManualItem(idx, 'productId', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                            >
                              {allProducts.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.articleTag ? `(${p.articleTag})` : ''} — Rs. {p.price}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Size */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Size</label>
                            <select
                              value={item.size}
                              onChange={e => handleUpdateManualItem(idx, 'size', Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
                            >
                              {sizes.map(s => (
                                <option key={s} value={s}>
                                  Size {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Color */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Color</label>
                            <select
                              value={item.selectedColor}
                              onChange={e => handleUpdateManualItem(idx, 'selectedColor', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 capitalize"
                            >
                              {colors.map(c => (
                                <option key={c} value={c}>
                                  {c.replace(/-/g, ' ')}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qty</label>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={item.quantity}
                              onChange={e => handleUpdateManualItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-bold text-center"
                            />
                          </div>
                        </div>

                        {/* Price & Line Subtotal */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-[11px]">Unit Price (Rs.):</span>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={e => handleUpdateManualItem(idx, 'unitPrice', Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-24 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-mono font-bold"
                            />
                          </div>
                          <div className="font-mono font-bold text-slate-900">
                            Line Total: {formatPrice(item.unitPrice * item.quantity)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Payment, Shipping & Status */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Payment, Delivery & Fulfillment
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={custPayment}
                      onChange={e => setCustPayment(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="cod">Cash on Delivery (COD)</option>
                      <option value="card">Debit/Credit Card</option>
                      <option value="jazzcash">JazzCash</option>
                      <option value="easypaisa">Easypaisa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Method</label>
                    <select
                      value={custShipping}
                      onChange={e => {
                        const method = e.target.value as any;
                        setCustShipping(method);
                        if (method === 'express') setCustShippingFee(settings.expressShippingFee || 450);
                        else if (method === 'artisan-courier') setCustShippingFee(750);
                        else setCustShippingFee(0);
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="standard">Standard Free Delivery</option>
                      <option value="express">Express Courier (+Rs. 450)</option>
                      <option value="artisan-courier">Artisan VIP Courier (+Rs. 750)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                    <select
                      value={custStatus}
                      onChange={e => setCustStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                    >
                      <option value="Placed">Placed (Pending Processing)</option>
                      <option value="Shipped">Shipped (In Transit)</option>
                      <option value="Delivered">Delivered (Completed)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Shipping Fee (Rs.)</label>
                    <input
                      type="number"
                      min={0}
                      value={custShippingFee}
                      onChange={e => setCustShippingFee(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Amount (Rs.)</label>
                    <input
                      type="number"
                      min={0}
                      value={custDiscount}
                      onChange={e => setCustDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Promo / Note Code</label>
                    <input
                      type="text"
                      value={custPromoCode}
                      onChange={e => setCustPromoCode(e.target.value)}
                      placeholder="e.g. VIP-MANUAL, EID10"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Live Order Calculation Summary */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Gross Subtotal ({manualItems.reduce((a, b) => a + Number(b.quantity || 1), 0)} items):</span>
                  <span className="font-mono font-bold text-slate-900">{formatPrice(manualSubtotal)}</span>
                </div>
                {custDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                    <span>Discount Applied:</span>
                    <span className="font-mono">-{formatPrice(custDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Shipping Fee:</span>
                  <span className="font-mono">{custShippingFee === 0 ? 'FREE' : formatPrice(custShippingFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-950 pt-2 border-t border-blue-200">
                  <span>Total Order Payable:</span>
                  <span className="font-mono text-base text-blue-700 font-black">{formatPrice(manualTotal)}</span>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="btn-copper text-xs py-2.5 px-6 font-bold flex items-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {isSubmittingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Create & Confirm Order
                    </>
                  )}
                </button>
              </div>

            </form>
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
            background: #F7F4EB !important;
            color: #1A1A18 !important;
            font-family: 'Forum', serif !important;
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
