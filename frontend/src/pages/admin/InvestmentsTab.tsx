import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Package, 
  TrendingUp, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  Wrench, 
  Sparkles, 
  ArrowUpRight,
  Boxes,
  Tag,
  SlidersHorizontal,
  PlusCircle,
  MinusCircle,
  History,
  Check,
  FileText
} from 'lucide-react';
import { apiService } from '../../services/api';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { BRAND_LOGO_BASE64 } from '../../assets/brandLogo';
import type { Product } from '../../types';
import type { InvestmentItem, InvestmentCategory, SupplierBudgetLog } from '../../types/admin';

interface InvestmentsTabProps {
  onNavigateTab?: (tab: string) => void;
}

const CATEGORY_CONFIG: Record<InvestmentCategory, { label: string; color: string; bg: string; border: string; icon: any }> = {
  packaging: {
    label: 'Packaging & Unboxing',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Package,
  },
  monetization: {
    label: 'Monetization & Ads',
    color: 'text-blue-800',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: TrendingUp,
  },
  marketing: {
    label: 'Marketing & PR',
    color: 'text-purple-800',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: Sparkles,
  },
  logistics: {
    label: 'Logistics & Supplies',
    color: 'text-indigo-800',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: Truck,
  },
  equipment: {
    label: 'Equipment & Tools',
    color: 'text-slate-800',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    icon: Wrench,
  },
  other: {
    label: 'Other Operational',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: Tag,
  },
};

export const InvestmentsTab: React.FC<InvestmentsTabProps> = ({ onNavigateTab }) => {
  const { settings } = useStoreSettings();
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvestmentItem | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    category: InvestmentCategory;
    amount: number;
    date: string;
    supplierOrVendor: string;
    notes: string;
  }>({
    title: '',
    category: 'packaging',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    supplierOrVendor: '',
    notes: '',
  });

  // Deletion modal
  const [deletingItem, setDeletingItem] = useState<InvestmentItem | null>(null);

  // Supplier Product Procurement Budget State (Fixed Capital, Independent of Orders)
  const [supplierBudget, setSupplierBudget] = useState<number>(1500);
  const [budgetLogs, setBudgetLogs] = useState<SupplierBudgetLog[]>([]);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetAction, setBudgetAction] = useState<'add' | 'remove' | 'set'>('add');
  const [budgetAmount, setBudgetAmount] = useState<number>(0);
  const [budgetNote, setBudgetNote] = useState<string>('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [invList, prodList, budgetData] = await Promise.all([
        apiService.getInvestments(),
        apiService.getProducts(true),
        apiService.getSupplierBudget(),
      ]);
      setInvestments(invList);
      setProducts(prodList);
      if (typeof budgetData.budget === 'number') {
        setSupplierBudget(budgetData.budget);
      }
      if (Array.isArray(budgetData.logs)) {
        setBudgetLogs(budgetData.logs);
      }
    } catch {
      showNotification('error', 'Failed to load investment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleInvestmentsChanged = () => loadData();
    const handleProductsChanged = () => loadData();
    const handleBudgetChanged = (e: any) => {
      if (e.detail?.budget !== undefined) {
        setSupplierBudget(e.detail.budget);
        if (e.detail.logs) setBudgetLogs(e.detail.logs);
      } else {
        loadData();
      }
    };
    // Silent auto-refresh from global polling broadcast
    const handleAutoRefresh = async () => {
      try {
        const [invList, prodList, budgetData] = await Promise.all([
          apiService.getInvestments(),
          apiService.getProducts(true),
          apiService.getSupplierBudget(),
        ]);
        setInvestments(invList);
        setProducts(prodList);
        if (typeof budgetData.budget === 'number') setSupplierBudget(budgetData.budget);
        if (Array.isArray(budgetData.logs)) setBudgetLogs(budgetData.logs);
      } catch {}
    };
    window.addEventListener('psh:investments-changed', handleInvestmentsChanged);
    window.addEventListener('psh:products-changed', handleProductsChanged);
    window.addEventListener('psh:supplier-budget-changed', handleBudgetChanged);
    window.addEventListener('psh:auto-refresh', handleAutoRefresh);
    return () => {
      window.removeEventListener('psh:investments-changed', handleInvestmentsChanged);
      window.removeEventListener('psh:products-changed', handleProductsChanged);
      window.removeEventListener('psh:supplier-budget-changed', handleBudgetChanged);
      window.removeEventListener('psh:auto-refresh', handleAutoRefresh);
    };
  }, []);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetAmount <= 0 && budgetAction !== 'set') {
      showNotification('error', 'Please enter a valid amount');
      return;
    }
    setIsSavingBudget(true);
    try {
      const res = await apiService.updateSupplierBudget(budgetAction, budgetAmount, budgetNote);
      setSupplierBudget(res.budget);
      if (res.logs) setBudgetLogs(res.logs);
      setIsBudgetModalOpen(false);
      setBudgetAmount(0);
      setBudgetNote('');
      showNotification('success', `Supplier product buying investment updated to Rs. ${res.budget.toLocaleString()}!`);
    } catch {
      showNotification('error', 'Failed to update supplier budget');
    } finally {
      setIsSavingBudget(false);
    }
  };

  // --- Financial Calculations ---
  // 1. Supplier Product Capital — FIXED once paid, NEVER reduced or increased by customer orders!
  // Calculated as: product buy price from supplier (costPrice) × inventory (stockCount)
  // Can also be manually adjusted or topped up by the store owner anytime.
  const inventoryTotalOutlay = products.reduce(
    (sum, p) => sum + (Number(p.costPrice) || 0) * (Number(p.stockCount) || 0),
    0
  );
  const totalPairsInStock = products.reduce(
    (sum, p) => sum + (Number(p.stockCount) || 0),
    0
  );

  const totalSupplierInvestment = (supplierBudget && supplierBudget > 1500)
    ? supplierBudget
    : (inventoryTotalOutlay > 0 ? inventoryTotalOutlay : (supplierBudget || 15000));

  const handleSyncInventory = async () => {
    setIsSavingBudget(true);
    try {
      const res = await apiService.updateSupplierBudget(
        'sync-inventory',
        inventoryTotalOutlay,
        `Synced with current catalog inventory: ${totalPairsInStock} pairs in stock`
      );
      setSupplierBudget(res.budget);
      if (res.logs) setBudgetLogs(res.logs);
      setIsBudgetModalOpen(false);
      showNotification('success', `Supplier product budget synced to Rs. ${res.budget.toLocaleString()} (${totalPairsInStock} pairs)!`);
    } catch {
      showNotification('error', 'Failed to sync budget with inventory');
    } finally {
      setIsSavingBudget(false);
    }
  };

  // 2. Operational Investments Breakdown
  const packagingTotal = investments
    .filter(i => i.category === 'packaging')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const monetizationTotal = investments
    .filter(i => i.category === 'monetization' || i.category === 'marketing')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const logisticsAndOtherTotal = investments
    .filter(i => i.category !== 'packaging' && i.category !== 'monetization' && i.category !== 'marketing')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const totalOperationalInvestments = investments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  // 3. Combined Grand Total Investment (Supplier + Packaging + Monetization + Ops)
  const grandTotalInvestment = totalSupplierInvestment + totalOperationalInvestments;

  // Filtered List
  const filteredInvestments = investments.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q 
      || (item.title && item.title.toLowerCase().includes(q))
      || (item.supplierOrVendor && item.supplierOrVendor.toLowerCase().includes(q))
      || (item.notes && item.notes.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'packaging',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      supplierOrVendor: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InvestmentItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      amount: item.amount,
      date: item.date || new Date().toISOString().split('T')[0],
      supplierOrVendor: item.supplierOrVendor || '',
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification('error', 'Please enter an expense title.');
      return;
    }
    if (formData.amount <= 0) {
      showNotification('error', 'Please enter a valid investment amount.');
      return;
    }

    try {
      if (editingItem) {
        await apiService.updateInvestment(editingItem.id, formData);
        showNotification('success', 'Investment entry updated successfully!');
      } else {
        await apiService.createInvestment(formData);
        showNotification('success', 'New investment entry recorded!');
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      showNotification('error', 'Failed to save investment.');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await apiService.deleteInvestment(deletingItem.id);
      showNotification('success', 'Investment entry removed.');
      setDeletingItem(null);
      loadData();
    } catch {
      showNotification('error', 'Failed to delete investment.');
    }
  };

  // ---- E-Statement PDF (styled HTML print window) ----
  const handleDownloadEStatement = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = today.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const statementNo = `EST-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const budgetHistoryRows = budgetLogs.map((log, idx) => {
      const act = log.type || log.action || 'set';
      const balance = log.newBudget ?? log.budgetAfter ?? 0;
      const badgeClass = act === 'add' ? 'green' : act === 'remove' ? 'red' : 'blue';
      return `
      <tr>
        <td class="text-center font-mono text-muted">${idx + 1}</td>
        <td class="font-mono">${log.date || '-'}</td>
        <td><span class="badge badge-${badgeClass}">${act.toUpperCase()}</span></td>
        <td class="amount text-right">Rs. ${Number(log.amount || 0).toLocaleString()}</td>
        <td class="amount text-right font-bold text-navy">Rs. ${Number(balance).toLocaleString()}</td>
        <td class="text-muted text-sm">${log.note || '-'}</td>
      </tr>`;
    }).join('');

    const investmentRows = investments.map((inv, idx) => {
      const catLabel = CATEGORY_CONFIG[inv.category as keyof typeof CATEGORY_CONFIG]?.label || inv.category;
      let badgeClass = 'badge-blue';
      if (inv.category === 'packaging') badgeClass = 'badge-purple';
      else if (inv.category === 'monetization') badgeClass = 'badge-amber';
      else if (inv.category === 'marketing') badgeClass = 'badge-indigo';
      else if (inv.category === 'equipment') badgeClass = 'badge-slate';
      else if (inv.category === 'logistics') badgeClass = 'badge-emerald';

      return `
      <tr>
        <td class="text-center font-mono text-muted">${idx + 1}</td>
        <td class="font-bold text-slate-800">${inv.title || '-'}</td>
        <td><span class="badge ${badgeClass}">${catLabel}</span></td>
        <td class="font-mono text-muted">${inv.date || '-'}</td>
        <td class="text-slate-700">${inv.supplierOrVendor || '-'}</td>
        <td class="text-muted text-sm">${inv.notes || '-'}</td>
        <td class="amount text-right font-bold text-navy">Rs. ${Number(inv.amount || 0).toLocaleString()}</td>
      </tr>`;
    }).join('');

    const productRows = products.map((p, idx) => {
      const cost = Number(p.costPrice) || 0;
      const price = Number(p.price) || 0;
      const stock = Number(p.stockCount) || 0;
      const totalOutlay = cost * stock;
      const margin = price - cost;

      return `
      <tr>
        <td class="text-center font-mono text-muted">${idx + 1}</td>
        <td><span class="sku-tag">${p.articleTag || 'N/A'}</span></td>
        <td class="font-bold text-slate-800">${p.name || '-'}</td>
        <td class="amount text-right">Rs. ${cost.toLocaleString()}</td>
        <td class="amount text-right text-muted">Rs. ${price.toLocaleString()}</td>
        <td class="text-center font-bold">${stock}</td>
        <td class="amount text-right text-emerald">${margin > 0 ? `+Rs. ${margin.toLocaleString()}` : '-'}</td>
        <td class="amount text-right font-bold text-navy">Rs. ${totalOutlay.toLocaleString()}</td>
      </tr>`;
    }).join('');

    const storeTitle = settings?.storeName || 'Peshawari Chappal Co.';
    const storeEmail = settings?.supportEmail || 'concierge@peshawarichappal.com';
    const storePhone = settings?.supportPhone || '+92 91 111 222 333';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${storeTitle} - Investment E-Statement (${statementNo})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 12mm 15mm 12mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.45;
      color: #1e293b;
      background: #f8fafc;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      max-width: 960px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px 40px;
      border-radius: 12px;
      box-shadow: 0 4px 25px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { max-width: 100%; margin: 0; padding: 0; border: none; box-shadow: none; }
      .no-print { display: none !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      .section { page-break-inside: avoid; }
    }

    /* Top Action Bar for on-screen */
    .action-bar {
      max-width: 960px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      padding: 14px 20px;
      border-radius: 10px;
      color: #fff;
    }
    .action-bar-title { font-size: 13px; font-weight: 700; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; }
    .action-btn-group { display: flex; gap: 10px; }
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary { background: #2563eb; color: #fff; box-shadow: 0 2px 10px rgba(37,99,235,0.35); }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #334155; color: #e2e8f0; }
    .btn-secondary:hover { background: #475569; }

    /* Header Block */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #0f172a;
      margin-bottom: 24px;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-logo-img {
      height: 56px;
      width: auto;
      max-width: 240px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .brand-info h1 {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .brand-info .tagline {
      font-size: 10px;
      font-weight: 600;
      color: #d97706;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .brand-meta {
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.35;
    }
    .statement-meta {
      text-align: right;
    }
    .statement-badge {
      display: inline-block;
      background: #0f172a;
      color: #fbbf24;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .statement-title {
      font-size: 18px;
      font-weight: 900;
      color: #1e40af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .statement-grid {
      font-size: 10px;
      color: #475569;
      line-height: 1.5;
    }
    .statement-grid strong {
      color: #0f172a;
    }

    /* Executive KPI Matrix */
    .kpi-section-title {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      background: #ffffff;
      position: relative;
      overflow: hidden;
    }
    .kpi-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
    }
    .kpi-card.primary::before { background: #2563eb; }
    .kpi-card.emerald::before { background: #059669; }
    .kpi-card.amber::before { background: #d97706; }
    .kpi-card.purple::before { background: #7c3aed; }
    .kpi-card.blue::before { background: #0284c7; }
    .kpi-card.teal::before { background: #0d9488; }

    .kpi-card.featured {
      background: #0f172a;
      color: #fff;
      border-color: #1e293b;
    }
    .kpi-card.featured::before { background: #fbbf24; }
    .kpi-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .kpi-card.featured .kpi-label { color: #94a3b8; }
    .kpi-value {
      font-size: 17px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.3px;
      margin-bottom: 2px;
    }
    .kpi-card.featured .kpi-value { color: #fbbf24; font-size: 19px; }
    .kpi-sub {
      font-size: 9.5px;
      color: #64748b;
    }
    .kpi-card.featured .kpi-sub { color: #94a3b8; }

    /* Tables & Sections */
    .section {
      margin-bottom: 26px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border-left: 4px solid #1e40af;
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 10px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-counter {
      background: #1e40af;
      color: #fff;
      font-size: 8.5px;
      padding: 2px 6px;
      border-radius: 12px;
      font-weight: 700;
    }
    .section-subtotal-badge {
      font-size: 10px;
      font-weight: 700;
      color: #1e40af;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    thead {
      background: #f8fafc;
      border-bottom: 2px solid #cbd5e1;
    }
    th {
      padding: 8px 10px;
      text-align: left;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #475569;
    }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    tfoot td {
      background: #f1f5f9;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #cbd5e1;
      border-bottom: none;
      padding: 9px 10px;
    }

    /* Badges & Tags */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .badge-green { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-red { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-blue { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-purple { background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; }
    .badge-indigo { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    .badge-emerald { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-slate { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }

    .sku-tag {
      display: inline-block;
      font-family: monospace;
      font-size: 9px;
      font-weight: 700;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }

    /* Utilities */
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }
    .text-navy { color: #0f172a; }
    .text-emerald { color: #059669; }
    .text-muted { color: #64748b; }
    .text-sm { font-size: 9.5px; }

    /* Grand Summary Reconciliation Box */
    .summary-box {
      border: 2px solid #0f172a;
      border-radius: 8px;
      background: #ffffff;
      padding: 18px 24px;
      margin-top: 24px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }
    .summary-left {
      flex: 1;
    }
    .summary-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      color: #475569;
      padding: 3px 0;
    }
    .summary-item.strong {
      color: #0f172a;
      font-weight: 700;
      border-top: 1px dashed #cbd5e1;
      margin-top: 4px;
      padding-top: 6px;
    }
    .summary-right {
      background: #0f172a;
      color: #ffffff;
      padding: 16px 22px;
      border-radius: 8px;
      text-align: right;
      min-width: 250px;
    }
    .summary-grand-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    .summary-grand-value {
      font-size: 22px;
      font-weight: 900;
      color: #fbbf24;
      letter-spacing: -0.5px;
    }
    .summary-grand-sub {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* Sign-off & Audit Trail */
    .signoff-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
    }
    .signoff-box {
      font-size: 10px;
    }
    .signoff-line {
      border-bottom: 1px solid #94a3b8;
      margin-top: 36px;
      margin-bottom: 6px;
    }
    .signoff-name {
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .signoff-role {
      color: #64748b;
      font-size: 9px;
    }

    /* Footer Notice */
    .doc-footer {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <!-- On-Screen Action Bar -->
  <div class="action-bar no-print">
    <div class="action-bar-title">
      <span>📄</span>
      <span>${storeTitle} &mdash; Official Investment & Capital E-Statement</span>
    </div>
    <div class="action-btn-group">
      <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
      <button class="btn btn-primary" onclick="window.print()">🖨️ Save as PDF / Print</button>
    </div>
  </div>

  <div class="sheet">
    <!-- Header Block -->
    <div class="header">
      <div class="brand-box">
        <!-- Exact Brand Logo -->
        <img src="${BRAND_LOGO_BASE64}" alt="${storeTitle}" class="brand-logo-img" />

        <div class="brand-info">
          <h1>${storeTitle}</h1>
          <div class="tagline">Tradition Meets Comfort &bull; Artisanal Footwear</div>
          <div class="brand-meta">
            ${storeEmail} &bull; ${storePhone}<br />
            Commercial Operations &amp; Capital Management Division
          </div>
        </div>
      </div>

      <div class="statement-meta">
        <div class="statement-badge">Official Certified Audit</div>
        <div class="statement-title">E-Statement</div>
        <div class="statement-grid">
          <div><strong>Statement No:</strong> <span class="font-mono">${statementNo}</span></div>
          <div><strong>Issue Date:</strong> ${dateStr}</div>
          <div><strong>Timestamp:</strong> ${timeStr}</div>
        </div>
      </div>
    </div>

    <!-- Executive KPI Matrix -->
    <div class="kpi-section-title">00 &bull; Executive Capital Allocation Summary</div>
    <div class="kpi-grid">
      <div class="kpi-card featured">
        <div class="kpi-label">Grand Total Capital Invested</div>
        <div class="kpi-value">Rs. ${grandTotalInvestment.toLocaleString()}</div>
        <div class="kpi-sub">Total Supplier &amp; Operations Outlay</div>
      </div>

      <div class="kpi-card emerald">
        <div class="kpi-label">Supplier Inventory Capital</div>
        <div class="kpi-value" style="color:#059669">Rs. ${totalSupplierInvestment.toLocaleString()}</div>
        <div class="kpi-sub">${totalPairsInStock} pairs in active catalog</div>
      </div>

      <div class="kpi-card amber">
        <div class="kpi-label">Total Operational Investments</div>
        <div class="kpi-value" style="color:#d97706">Rs. ${totalOperationalInvestments.toLocaleString()}</div>
        <div class="kpi-sub">${investments.length} recorded ledger transactions</div>
      </div>

      <div class="kpi-card purple">
        <div class="kpi-label">Packaging &amp; Unboxing</div>
        <div class="kpi-value" style="color:#7c3aed">Rs. ${packagingTotal.toLocaleString()}</div>
        <div class="kpi-sub">Custom boxes, dust bags &amp; tags</div>
      </div>

      <div class="kpi-card blue">
        <div class="kpi-label">Monetization &amp; Ad Spend</div>
        <div class="kpi-value" style="color:#0284c7">Rs. ${monetizationTotal.toLocaleString()}</div>
        <div class="kpi-sub">Paid media, ads &amp; PR campaigns</div>
      </div>

      <div class="kpi-card teal">
        <div class="kpi-label">Logistics, Tools &amp; Ops</div>
        <div class="kpi-value" style="color:#0d9488">Rs. ${logisticsAndOtherTotal.toLocaleString()}</div>
        <div class="kpi-sub">Supplies, workshop tools &amp; misc</div>
      </div>
    </div>

    <!-- Section 01: Detailed Operational Investment Ledger -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <span>01 &bull; Operational Investment &amp; Expense Ledger</span>
          <span class="section-counter">${investments.length} Entries</span>
        </div>
        <div class="section-subtotal-badge">
          Subtotal: Rs. ${totalOperationalInvestments.toLocaleString()}
        </div>
      </div>

      ${investments.length === 0 ? '<p style="color:#94a3b8;font-style:italic;padding:12px;background:#f8fafc;border-radius:6px;text-align:center;">No operational investment entries recorded.</p>' : `
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width:36px;">#</th>
            <th>Investment Title / Description</th>
            <th style="width:140px;">Category</th>
            <th style="width:90px;">Date</th>
            <th>Supplier / Vendor</th>
            <th>Audit Notes</th>
            <th class="text-right" style="width:110px;">Amount (PKR)</th>
          </tr>
        </thead>
        <tbody>
          ${investmentRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="6" class="text-right">Total Operational Capital Deployed:</td>
            <td class="amount text-right font-bold text-navy">Rs. ${totalOperationalInvestments.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>`}
    </div>

    <!-- Section 02: Product Catalog & Supplier Capital -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <span>02 &bull; Product Catalog Inventory &amp; Capital Valuation</span>
          <span class="section-counter">${products.length} Articles</span>
        </div>
        <div class="section-subtotal-badge">
          Outlay: Rs. ${inventoryTotalOutlay.toLocaleString()}
        </div>
      </div>

      ${products.length === 0 ? '<p style="color:#94a3b8;font-style:italic;padding:12px;background:#f8fafc;border-radius:6px;text-align:center;">No products in catalog.</p>' : `
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width:36px;">#</th>
            <th style="width:85px;">SKU / Tag</th>
            <th>Product Name</th>
            <th class="text-right" style="width:95px;">Unit Cost</th>
            <th class="text-right" style="width:95px;">Selling Price</th>
            <th class="text-center" style="width:60px;">Stock</th>
            <th class="text-right" style="width:95px;">Unit Margin</th>
            <th class="text-right" style="width:110px;">Total Outlay</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="text-right">Total In-Stock Catalog Pairs:</td>
            <td class="text-center font-bold">${totalPairsInStock}</td>
            <td class="text-right font-bold text-navy">Total Value:</td>
            <td class="amount text-right font-bold text-navy">Rs. ${inventoryTotalOutlay.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>`}
    </div>

    <!-- Section 03: Supplier Budget Adjustment Logs (Optional) -->
    ${budgetLogs.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <span>03 &bull; Supplier Capital Budget Adjustments</span>
          <span class="section-counter">${budgetLogs.length} Records</span>
        </div>
        <div class="section-subtotal-badge">
          Current Budget: Rs. ${totalSupplierInvestment.toLocaleString()}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width:36px;">#</th>
            <th style="width:140px;">Timestamp</th>
            <th style="width:110px;">Action Type</th>
            <th class="text-right" style="width:110px;">Amount Adjusted</th>
            <th class="text-right" style="width:120px;">Balance After</th>
            <th>Audit Note</th>
          </tr>
        </thead>
        <tbody>
          ${budgetHistoryRows}
        </tbody>
      </table>
    </div>` : ''}

    <!-- Reconciliation & Grand Total Balance -->
    <div class="summary-box">
      <div class="summary-left">
        <div class="summary-title">Capital Statement Reconciliation</div>
        <div class="summary-item">
          <span>01. Supplier Inventory Outlay (Physical Stock):</span>
          <span class="font-mono font-bold">Rs. ${totalSupplierInvestment.toLocaleString()}</span>
        </div>
        <div class="summary-item">
          <span>02. Operational &amp; Brand Investments:</span>
          <span class="font-mono font-bold">Rs. ${totalOperationalInvestments.toLocaleString()}</span>
        </div>
        <div class="summary-item strong">
          <span>Total Capital Invested (Net Outlay):</span>
          <span class="font-mono font-bold text-navy">Rs. ${grandTotalInvestment.toLocaleString()}</span>
        </div>
      </div>

      <div class="summary-right">
        <div class="summary-grand-label">Grand Total Capital Deployed</div>
        <div class="summary-grand-value">Rs. ${grandTotalInvestment.toLocaleString()}</div>
        <div class="summary-grand-sub">Calculated across all supplier &amp; operational accounts</div>
      </div>
    </div>

    <!-- Sign-Off & Verification -->
    <div class="signoff-grid">
      <div class="signoff-box">
        <div class="signoff-role">Prepared &amp; Compiled By:</div>
        <div class="signoff-line"></div>
        <div class="signoff-name">Operations &amp; Finance Team</div>
        <div class="signoff-role">${storeTitle}</div>
      </div>
      <div class="signoff-box">
        <div class="signoff-role">Verified &amp; Certified By:</div>
        <div class="signoff-line"></div>
        <div class="signoff-name">Managing Director / Administration</div>
        <div class="signoff-role">Certified Official Record</div>
      </div>
    </div>

    <!-- Document Footer -->
    <div class="doc-footer">
      <span>&copy; ${today.getFullYear()} ${storeTitle}. Confidential Financial Audit Statement.</span>
      <span>Printed on ${dateStr} at ${timeStr}</span>
    </div>
  </div>

  <!-- Bottom Floating Action Bar for Web View -->
  <div class="action-bar no-print" style="margin-top: 24px;">
    <div class="action-bar-title">
      <span>💡 Tip:</span>
      <span style="font-size:11px;font-weight:normal;color:#94a3b8;">Choose "Save as PDF" and enable "Background Graphics" in the print dialog for high-res vector output.</span>
    </div>
    <div class="action-btn-group">
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1020,height=850,scrollbars=yes');
    if (!win) {
      showNotification('error', 'Popup blocked! Please allow popups for this site.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    // Auto-trigger print after the content loads
    win.onload = () => win.print();
    showNotification('success', 'Investment E-Statement opened — select "Save as PDF" in your print dialog!');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold backdrop-blur-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/30'
              : 'bg-red-950/90 text-red-200 border border-red-500/30'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 flex items-center gap-2.5">
            <Coins className="w-6 h-6 text-amber-600" />
            Packaging, Monetization & Capital Investments
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track luxury packaging, monetization ads, branding, logistics, and supplier procurement capital.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Download E-Statement */}
          <button
            onClick={handleDownloadEStatement}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
            title="Download full investment e-statement as CSV"
          >
            <FileText className="w-4 h-4" />
            <span>E-Statement</span>
          </button>

          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow active:scale-98 cursor-pointer"
            title="Manually add or remove product procurement budget from supplier"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Adjust Supplier Budget (+ / -)</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Investment</span>
          </button>
        </div>
      </div>

      {/* Executive Financial Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Combined Total Investment (Grand Capital) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-md space-y-2 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Total Capital Investment</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-white">Rs. {grandTotalInvestment.toLocaleString()}</div>
          <div className="text-[11px] text-slate-300 font-medium leading-snug">
            Supplier Goods + Packaging, Ads & Ops
          </div>
        </div>

        {/* Card 2: Supplier Product Buying Capital (Fixed, untouched by orders) */}
        <div className="bg-white rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-white to-emerald-50/20 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900">Supplier Product Buying</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-emerald-800">Rs. {totalSupplierInvestment.toLocaleString()}</div>
          <div className="flex flex-col gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="text-emerald-800 font-semibold">
              {totalPairsInStock > 0 ? `${totalPairsInStock} pairs in stock × supplier buy cost` : 'Fixed capital (once paid is paid)'}
            </span>
            <span className="text-slate-400 text-[10px]">Fixed capital • Untouched by orders</span>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button 
                onClick={() => setIsBudgetModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors cursor-pointer shadow-xs"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Adjust Budget (+ / -)</span>
              </button>
              {onNavigateTab && (
                <button 
                  onClick={() => onNavigateTab('products')}
                  className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 text-[10px] cursor-pointer"
                  title="View Products Catalog"
                >
                  <span>{products.length} {products.length === 1 ? 'Product' : 'Products'}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Packaging & Unboxing */}
        <div className="bg-white rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">Packaging & Boxes</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-amber-900">Rs. {packagingTotal.toLocaleString()}</div>
          <div className="text-[11px] text-amber-800/80 font-medium">
            Luxury boxes, velvet dust bags & tags
          </div>
        </div>

        {/* Card 4: Monetization & Marketing */}
        <div className="bg-white rounded-2xl border border-blue-200/80 bg-gradient-to-br from-white to-blue-50/30 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-900">Monetization & Ads</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800 border border-blue-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-blue-900">Rs. {monetizationTotal.toLocaleString()}</div>
          <div className="text-[11px] text-blue-800/80 font-medium">
            Meta, TikTok, influencers & creatives
          </div>
        </div>

        {/* Card 5: Logistics & Other Equipment */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Logistics & Gear</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-slate-900">Rs. {logisticsAndOtherTotal.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            Courier flyers, tools & workspace
          </div>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Investments' },
            { id: 'packaging', label: 'Packaging' },
            { id: 'monetization', label: 'Monetization' },
            { id: 'marketing', label: 'Marketing' },
            { id: 'logistics', label: 'Logistics' },
            { id: 'equipment', label: 'Equipment' },
            { id: 'other', label: 'Other' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, vendor, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Investment Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-base text-slate-900">Capital Ledger & Investment Records</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredInvestments.length} {filteredInvestments.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Active Total: <strong className="text-slate-900">Rs. {filteredInvestments.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString()}</strong>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading investment records...</div>
        ) : filteredInvestments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No investment records found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Record custom investments for custom luxury packaging, video ad monetization, or workshop tools.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First Investment</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Investment Item / Purpose</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4 text-right">Amount (Rs.)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredInvestments.map(item => {
                  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
                  const Icon = cfg.icon;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {item.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{item.title}</div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cfg.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.supplierOrVendor || <span className="text-slate-400 italic">Direct Expense</span>}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-950 text-sm">
                          Rs. {Number(item.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Investment"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record / Edit Investment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-serif font-bold text-slate-900 text-base">
                {editingItem ? 'Edit Investment Record' : 'Record New Capital Investment'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Investment Title / Expense Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 500 Custom Handcrafted Luxury Rigid Boxes"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as InvestmentCategory })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold bg-white"
                  >
                    <option value="packaging">Packaging & Unboxing</option>
                    <option value="monetization">Monetization & Ads</option>
                    <option value="marketing">Marketing & PR</option>
                    <option value="logistics">Logistics & Shipping Supplies</option>
                    <option value="equipment">Equipment & Tools</option>
                    <option value="other">Other Operational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount Invested (Rs.) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.amount > 0 ? formData.amount : ''}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) || 0 })}
                    placeholder="e.g. 35000"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Vendor / Supplier (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.supplierOrVendor}
                    onChange={e => setFormData({ ...formData, supplierOrVendor: e.target.value })}
                    placeholder="e.g. Lahore Box Crafters"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes / Specification
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional invoice reference, batch size, or materials details..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Record Investment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-slate-900">Delete Investment Record?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{deletingItem.title}"</strong> (Rs. {Number(deletingItem.amount).toLocaleString()})? This will update your total capital metrics.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-xs cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Supplier Procurement Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-base">
                    Adjust Supplier Buying Budget
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Fixed product procurement capital (once paid is paid • untouched by orders)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
              {/* Current Status Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Supplier Investment</span>
                    <span className="font-serif font-bold text-xl text-slate-900">Rs. {totalSupplierInvestment.toLocaleString()}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                    Fixed Capital
                  </span>
                </div>

                {/* Inventory Valuation Card */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs gap-3">
                  <div>
                    <span className="font-bold text-emerald-900 block">Catalog Inventory Outlay:</span>
                    <span className="text-[11px] text-emerald-700">
                      {totalPairsInStock} pairs in stock × supplier buy cost = <strong className="font-mono font-bold">Rs. {inventoryTotalOutlay.toLocaleString()}</strong>
                    </span>
                  </div>
                  {inventoryTotalOutlay > 0 && (
                    <button
                      type="button"
                      disabled={isSavingBudget}
                      onClick={handleSyncInventory}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      title="Sync fixed budget to match catalog inventory (costPrice × stockCount)"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Sync to Stock</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mode Selection Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Adjustment Action *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBudgetAction('add')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      budgetAction === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Add Capital</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBudgetAction('remove')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      budgetAction === 'remove'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>- Deduct</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBudgetAction('set')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      budgetAction === 'set'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Set Exact</span>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {budgetAction === 'add' ? 'Amount to Add (PKR Rs.) *' : budgetAction === 'remove' ? 'Amount to Deduct (PKR Rs.) *' : 'Set Exact Supplier Budget (PKR Rs.) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rs.</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={budgetAmount > 0 ? budgetAmount : ''}
                    onChange={e => setBudgetAmount(Number(e.target.value) || 0)}
                    placeholder={budgetAction === 'set' ? '1500' : 'e.g. 15000'}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Quick Presets for Adding */}
              {budgetAction === 'add' && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Quick Add:</span>
                  {[1500, 3000, 7500, 15000, 30000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBudgetAmount(val)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-bold text-[10px] transition-colors cursor-pointer border border-slate-200"
                    >
                      +Rs. {val.toLocaleString()}
                    </button>
                  ))}
                </div>
              )}

              {/* Real-time Calculation Preview */}
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-900">Resulting Total Supplier Investment:</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  Rs. {(
                    budgetAction === 'add'
                      ? supplierBudget + (Number(budgetAmount) || 0)
                      : budgetAction === 'remove'
                      ? Math.max(0, supplierBudget - (Number(budgetAmount) || 0))
                      : Math.max(0, Number(budgetAmount) || 0)
                  ).toLocaleString()}
                </span>
              </div>

              {/* Note / Memo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Memo / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={budgetNote}
                  onChange={e => setBudgetNote(e.target.value)}
                  placeholder="e.g. Purchased 10 pairs from Charsadda artisan workshop"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Past History Logs */}
              {budgetLogs.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    <History className="w-3 h-3" />
                    <span>Adjustment History</span>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                    {budgetLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">
                            {log.type === 'add' ? `+Rs. ${log.amount.toLocaleString()}` : log.type === 'remove' ? `-Rs. ${log.amount.toLocaleString()}` : `Set to Rs. ${(log.newBudget ?? log.budgetAfter ?? 0).toLocaleString()}`}
                          </span>
                          {log.note && <span className="text-slate-400 ml-1.5 italic">"{log.note}"</span>}
                        </div>
                        <span className="text-slate-400 text-[10px]">{log.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBudget}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingBudget ? 'Saving...' : 'Confirm & Save Budget'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
