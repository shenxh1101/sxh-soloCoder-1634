import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  AlertTriangle,
  TrendingUp,
  Package,
  Pill,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShoppingCart,
  CheckSquare,
  Square
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Medicine, Supplier, CATEGORY_LABELS, PurchaseOrderItem } from '../../types';
import { daysToExpiry, getExpiryAlertLevel, formatDate, getTodayString, addDays } from '../../utils/date';
import { cn } from '../../lib/utils';
import { getTopSellers } from '../../utils/statistics';

interface RestockItem {
  medicine: Medicine;
  supplier: Supplier | undefined;
  priority: 'critical' | 'high' | 'medium' | 'low';
  priorityScore: number;
  reasons: string[];
  suggestedQuantity: number;
  daysToExpiry: number;
  stockLevel: 'critical' | 'low' | 'normal';
  salesRank: number;
  profitRank: number;
}

type SortField = 'priority' | 'expiry' | 'stock' | 'sales' | 'profit';
type SortOrder = 'asc' | 'desc';

export default function RestockSuggestion() {
  const navigate = useNavigate();
  const { medicines, suppliers, sales, createPurchaseOrder } = useStore();
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPurchasePanel, setShowPurchasePanel] = useState(false);

  const topSellers = useMemo(() => getTopSellers(sales, medicines, 'month', 50), [sales, medicines]);
  const topProfit = useMemo(() => [...topSellers].sort((a, b) => b.profit - a.profit), [topSellers]);

  const restockItems = useMemo((): RestockItem[] => {
    const items: RestockItem[] = [];

    medicines.forEach(medicine => {
      const daysRemaining = daysToExpiry(medicine.expiryDate);
      const stockPercentage = medicine.safetyStock > 0 
        ? (medicine.stock / medicine.safetyStock) * 100 
        : 100;
      
      const reasons: string[] = [];
      let priorityScore = 0;

      if (daysRemaining <= 7) {
        reasons.push('即将过期（7天内）');
        priorityScore += 40;
      } else if (daysRemaining <= 30) {
        reasons.push('临近过期（30天内）');
        priorityScore += 20;
      } else if (daysRemaining <= 90) {
        reasons.push('保质期过半');
        priorityScore += 5;
      }

      if (medicine.stock === 0) {
        reasons.push('库存已断货');
        priorityScore += 35;
      } else if (stockPercentage <= 30) {
        reasons.push('库存严重不足');
        priorityScore += 25;
      } else if (stockPercentage <= 60) {
        reasons.push('库存偏低');
        priorityScore += 10;
      }

      const salesRank = topSellers.findIndex(s => s.medicine.id === medicine.id);
      const profitRank = topProfit.findIndex(p => p.medicine.id === medicine.id);

      if (salesRank >= 0 && salesRank < 5) {
        reasons.push('销量TOP5');
        priorityScore += 20;
      } else if (salesRank >= 0 && salesRank < 10) {
        reasons.push('销量TOP10');
        priorityScore += 10;
      }

      if (profitRank >= 0 && profitRank < 5) {
        reasons.push('利润TOP5');
        priorityScore += 15;
      } else if (profitRank >= 0 && profitRank < 10) {
        reasons.push('利润TOP10');
        priorityScore += 8;
      }

      if (reasons.length === 0) return;

      let priority: 'critical' | 'high' | 'medium' | 'low';
      if (priorityScore >= 50) priority = 'critical';
      else if (priorityScore >= 30) priority = 'high';
      else if (priorityScore >= 15) priority = 'medium';
      else priority = 'low';

      let stockLevel: 'critical' | 'low' | 'normal';
      if (stockPercentage <= 30) stockLevel = 'critical';
      else if (stockPercentage <= 60) stockLevel = 'low';
      else stockLevel = 'normal';

      const avgMonthlySales = salesRank >= 0 
        ? topSellers[salesRank].quantity / 4 
        : 0;
      
      let suggestedQuantity = 0;
      if (stockPercentage <= 50) {
        const targetStock = medicine.safetyStock * 2;
        suggestedQuantity = Math.max(targetStock - medicine.stock, medicine.safetyStock);
      } else if (salesRank >= 0 && salesRank < 10) {
        suggestedQuantity = Math.ceil(avgMonthlySales * 1.5);
      }
      suggestedQuantity = Math.max(suggestedQuantity, medicine.safetyStock);
      suggestedQuantity = Math.ceil(suggestedQuantity / 5) * 5;

      const supplier = suppliers.find(s => s.id === medicine.supplierId);

      items.push({
        medicine,
        supplier,
        priority,
        priorityScore,
        reasons,
        suggestedQuantity,
        daysToExpiry: daysRemaining,
        stockLevel,
        salesRank: salesRank + 1 || 999,
        profitRank: profitRank + 1 || 999
      });
    });

    return items;
  }, [medicines, suppliers, topSellers, topProfit]);

  const sortedItems = useMemo(() => {
    let filtered = restockItems;
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.medicine.category === categoryFilter);
    }

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'priority':
          comparison = a.priorityScore - b.priorityScore;
          break;
        case 'expiry':
          comparison = a.daysToExpiry - b.daysToExpiry;
          break;
        case 'stock':
          comparison = a.medicine.stock - b.medicine.stock;
          break;
        case 'sales':
          comparison = a.salesRank - b.salesRank;
          break;
        case 'profit':
          comparison = a.profitRank - b.profitRank;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [restockItems, sortField, sortOrder, categoryFilter]);

  const toggleSelect = (medicineId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(medicineId)) next.delete(medicineId);
      else next.add(medicineId);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === sortedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedItems.map(i => i.medicine.id)));
    }
  };

  const selectedItems = sortedItems.filter(i => selectedIds.has(i.medicine.id));

  const supplierGroups = useMemo(() => {
    const groups = new Map<string, {
      supplier: Supplier | undefined;
      items: RestockItem[];
    }>();

    selectedItems.forEach(item => {
      const key = item.supplier?.id || 'no-supplier';
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(key, { supplier: item.supplier, items: [item] });
      }
    });

    return Array.from(groups.values());
  }, [selectedItems]);

  const handleGeneratePurchaseOrders = () => {
    supplierGroups.forEach(group => {
      if (!group.supplier) return;

      const poItems: Omit<PurchaseOrderItem, 'id'>[] = group.items.map(item => ({
        medicineId: item.medicine.id,
        medicineName: item.medicine.name,
        specification: item.medicine.specification,
        quantity: item.suggestedQuantity,
        unitCost: item.medicine.costPrice,
        totalCost: item.suggestedQuantity * item.medicine.costPrice,
        batchNumber: `B${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
        productionDate: getTodayString(),
        expiryDate: addDays(getTodayString(), 365)
      }));

      createPurchaseOrder(poItems, group.supplier.id);
    });

    setSelectedIds(new Set());
    setShowPurchasePanel(false);
    navigate('/purchase-orders');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ label, field }: { label: string; field: SortField }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:bg-slate-50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          sortOrder === 'desc' 
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronUp className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return '紧急';
      case 'high': return '高';
      case 'medium': return '中';
      default: return '低';
    }
  };

  const criticalCount = restockItems.filter(i => i.priority === 'critical').length;
  const highCount = restockItems.filter(i => i.priority === 'high').length;
  const totalSuggestedCost = sortedItems.reduce((sum, item) => 
    sum + item.suggestedQuantity * item.medicine.costPrice, 0
  );

  const selectedTotalCost = selectedItems.reduce((sum, item) =>
    sum + item.suggestedQuantity * item.medicine.costPrice, 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">进货建议</h1>
          <p className="text-slate-500 mt-1">智能分析库存、销售和利润，给出进货建议</p>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={() => setShowPurchasePanel(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg shadow-green-500/30"
          >
            <ShoppingCart className="w-5 h-5" />
            生成采购单（{selectedIds.size} 项）
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">紧急补货</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">高优先级</p>
              <p className="text-2xl font-bold text-orange-600">{highCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">待补药品</p>
              <p className="text-2xl font-bold text-slate-900">{restockItems.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">预计进货成本</p>
              <p className="text-2xl font-bold text-green-600">¥{totalSuggestedCost.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="all">全部分类</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button
          onClick={selectAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        >
          {selectedIds.size === sortedItems.length && sortedItems.length > 0 ? (
            <CheckSquare className="w-4 h-4 text-blue-600" />
          ) : (
            <Square className="w-4 h-4 text-slate-400" />
          )}
          {selectedIds.size === sortedItems.length && sortedItems.length > 0 ? '取消全选' : '全选'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12" />
                <SortHeader label="优先级" field="priority" />
                <SortHeader label="药品信息" field="priority" />
                <SortHeader label="库存" field="stock" />
                <SortHeader label="有效期" field="expiry" />
                <SortHeader label="销量排名" field="sales" />
                <SortHeader label="利润排名" field="profit" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">建议补货</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">供应商</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无进货建议</p>
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <>
                    <tr 
                      key={item.medicine.id}
                      className={cn(
                        'hover:bg-slate-50 cursor-pointer transition-colors',
                        selectedIds.has(item.medicine.id) && 'bg-blue-50/50'
                      )}
                      onClick={() => setExpandedId(expandedId === item.medicine.id ? null : item.medicine.id)}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleSelect(item.medicine.id)}>
                          {selectedIds.has(item.medicine.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'px-3 py-1 rounded-full text-xs font-semibold',
                          getPriorityBadge(item.priority)
                        )}>
                          {getPriorityLabel(item.priority)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Pill className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{item.medicine.name}</p>
                            <p className="text-xs text-slate-500">{item.medicine.specification}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                              {CATEGORY_LABELS[item.medicine.category]}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className={cn(
                            'font-semibold',
                            item.stockLevel === 'critical' ? 'text-red-600' :
                            item.stockLevel === 'low' ? 'text-orange-600' : 'text-slate-900'
                          )}>
                            {item.medicine.stock} {item.medicine.unit}
                          </p>
                          <p className="text-xs text-slate-500">安全库存: {item.medicine.safetyStock} {item.medicine.unit}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className={cn(
                            'font-medium',
                            item.daysToExpiry <= 7 ? 'text-red-600' :
                            item.daysToExpiry <= 30 ? 'text-orange-600' : 'text-slate-900'
                          )}>
                            {item.daysToExpiry > 0 
                              ? `还剩 ${item.daysToExpiry} 天`
                              : `已过期 ${Math.abs(item.daysToExpiry)} 天`
                            }
                          </p>
                          <p className="text-xs text-slate-500">{formatDate(item.medicine.expiryDate)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {item.salesRank <= 50 ? (
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            item.salesRank <= 3 ? 'bg-yellow-100 text-yellow-700' :
                            item.salesRank <= 10 ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          )}>
                            第 {item.salesRank} 名
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {item.profitRank <= 50 ? (
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            item.profitRank <= 3 ? 'bg-green-100 text-green-700' :
                            item.profitRank <= 10 ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-600'
                          )}>
                            第 {item.profitRank} 名
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-blue-600">{item.suggestedQuantity} {item.medicine.unit}</p>
                          <p className="text-xs text-slate-500">约 ¥{(item.suggestedQuantity * item.medicine.costPrice).toFixed(0)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {item.supplier ? (
                          <div>
                            <p className="font-medium text-slate-900">{item.supplier.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {item.supplier.phone}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">未设置</span>
                        )}
                      </td>
                    </tr>
                    {expandedId === item.medicine.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-2">补货原因</h4>
                              <ul className="space-y-1">
                                {item.reasons.map((reason, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-2">建议补货量说明</h4>
                              <p className="text-sm text-slate-600">
                                基于安全库存（{item.medicine.safetyStock} {item.medicine.unit}）的 2 倍备货，
                                建议补货 {item.suggestedQuantity} {item.medicine.unit}。
                                预计进货成本 ¥{(item.suggestedQuantity * item.medicine.costPrice).toFixed(2)}，
                                预计销售利润 ¥{(item.suggestedQuantity * (item.medicine.salePrice - item.medicine.costPrice)).toFixed(2)}。
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-2">供应商信息</h4>
                              {item.supplier ? (
                                <div className="space-y-2">
                                  <p className="font-medium">{item.supplier.name}</p>
                                  <p className="text-sm text-slate-600 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    {item.supplier.phone}
                                  </p>
                                  <p className="text-sm text-slate-600 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    {item.supplier.address}
                                  </p>
                                  {item.supplier.contact && (
                                    <p className="text-sm text-slate-500">联系人: {item.supplier.contact}</p>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/suppliers');
                                    }}
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    查看详情 <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400">暂无供应商信息</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPurchasePanel && selectedItems.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">生成采购单</h2>
                <button
                  onClick={() => setShowPurchasePanel(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                已选 {selectedItems.length} 项，按供应商合并为 {supplierGroups.filter(g => g.supplier).length} 个采购单
              </p>
            </div>

            <div className="p-6 space-y-6">
              {supplierGroups.map((group, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-slate-900">
                        {group.supplier?.name || '未设置供应商'}
                      </span>
                      {group.supplier && (
                        <span className="text-sm text-slate-500">
                          ({group.supplier.phone})
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      ¥{group.items.reduce((sum, i) => sum + i.suggestedQuantity * i.medicine.costPrice, 0).toFixed(2)}
                    </span>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500">药品</th>
                        <th className="text-right py-2 px-4 text-xs font-semibold text-slate-500">数量</th>
                        <th className="text-right py-2 px-4 text-xs font-semibold text-slate-500">单价</th>
                        <th className="text-right py-2 px-4 text-xs font-semibold text-slate-500">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map(item => (
                        <tr key={item.medicine.id} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 px-4">
                            <p className="font-medium text-sm">{item.medicine.name}</p>
                            <p className="text-xs text-slate-500">{item.medicine.specification}</p>
                          </td>
                          <td className="py-2 px-4 text-right text-sm">{item.suggestedQuantity} {item.medicine.unit}</td>
                          <td className="py-2 px-4 text-right text-sm">¥{item.medicine.costPrice.toFixed(2)}</td>
                          <td className="py-2 px-4 text-right text-sm font-medium">
                            ¥{(item.suggestedQuantity * item.medicine.costPrice).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              <div className="bg-green-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">采购总成本</p>
                  <p className="text-2xl font-bold text-green-600">¥{selectedTotalCost.toFixed(2)}</p>
                </div>
                <p className="text-sm text-slate-500">
                  共 {supplierGroups.filter(g => g.supplier).length} 个供应商
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPurchasePanel(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleGeneratePurchaseOrders}
                disabled={supplierGroups.filter(g => g.supplier).length === 0}
                className={cn(
                  'px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2',
                  supplierGroups.filter(g => g.supplier).length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                <CheckSquare className="w-4 h-4" />
                确认生成采购单
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">进货建议说明</h3>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>• <strong>紧急优先级</strong>：库存断货或有效期小于7天，需立即处理</li>
              <li>• <strong>高优先级</strong>：库存严重不足或临近过期（30天内），建议尽快补货</li>
              <li>• <strong>建议补货量</strong>：综合考虑安全库存、月均销量和保质期得出的参考值</li>
              <li>• 勾选需要补货的药品，点击"生成采购单"按供应商自动合并</li>
              <li>• 采购单生成后可在"采购管理"页面查看和跟踪</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
