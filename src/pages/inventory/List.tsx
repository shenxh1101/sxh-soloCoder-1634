import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Package, ClipboardCheck, Clock, X, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import DataTable, { Column } from '../../components/DataTable';
import SearchInput from '../../components/SearchInput';
import Modal from '../../components/Modal';
import { InventoryRecord, Medicine, MedicineBatch, CATEGORY_LABELS, StockTake, StockTakeItem, SALE_STATUS_LABELS } from '../../types';
import { formatDate, daysToExpiry, getExpiryAlertLevel, getStockAlertLevel } from '../../utils/date';
import { cn } from '../../lib/utils';

export default function InventoryList() {
  const navigate = useNavigate();
  const { medicines, inventoryRecords, batches, addInventory, stockTakes, createStockTake, updateStockTakeItem, confirmStockTake, getStockTakesByDate } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [stockTakeSearch, setStockTakeSearch] = useState('');
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [showStockTakeModal, setShowStockTakeModal] = useState(false);
  const [showStockTakeHistory, setShowStockTakeHistory] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [currentStockTake, setCurrentStockTake] = useState<StockTake | null>(null);
  const [inboundForm, setInboundForm] = useState({
    medicineId: '',
    quantity: 10,
    unitCost: 0,
    productionDate: '',
    expiryDate: '',
    batchNumber: ''
  });
  const [activeTab, setActiveTab] = useState<'status' | 'batches' | 'records' | 'stocktake'>('status');

  const filteredRecords = inventoryRecords.filter(r => {
    const medicine = medicines.find(m => m.id === r.medicineId);
    if (!medicine) return false;
    return medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           r.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredStockTakes = stockTakes.filter(st => 
    st.takeDate.includes(stockTakeSearch) ||
    st.remark.toLowerCase().includes(stockTakeSearch.toLowerCase())
  );

  const openInboundModal = (medicine?: Medicine) => {
    if (medicine) {
      setSelectedMedicine(medicine);
      setInboundForm({
        medicineId: medicine.id,
        quantity: 10,
        unitCost: medicine.costPrice,
        productionDate: medicine.productionDate,
        expiryDate: medicine.expiryDate,
        batchNumber: ''
      });
    } else {
      setSelectedMedicine(null);
      setInboundForm({
        medicineId: '',
        quantity: 10,
        unitCost: 0,
        productionDate: '',
        expiryDate: '',
        batchNumber: ''
      });
    }
    setShowInboundModal(true);
  };

  const handleInboundSubmit = () => {
    if (!inboundForm.medicineId || !inboundForm.productionDate || !inboundForm.expiryDate || !inboundForm.batchNumber) {
      return;
    }
    
    const medicine = medicines.find(m => m.id === inboundForm.medicineId);
    addInventory({
      ...inboundForm,
      medicineName: medicine?.name,
      inboundDate: new Date().toISOString()
    });
    setShowInboundModal(false);
  };

  const startStockTake = () => {
    const items: Omit<StockTakeItem, 'id' | 'difference' | 'differenceAmount'>[] = [];
    
    batches.filter(b => b.quantity > 0).forEach(batch => {
      const medicine = medicines.find(m => m.id === batch.medicineId);
      if (medicine) {
        items.push({
          medicineId: batch.medicineId,
          medicineName: medicine.name,
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          expectedQuantity: batch.quantity,
          actualQuantity: batch.quantity,
          unitCost: batch.unitCost
        });
      }
    });

    medicines.filter(m => {
      const hasBatches = batches.some(b => b.medicineId === m.id && b.quantity > 0);
      return !hasBatches && m.stock > 0;
    }).forEach(medicine => {
      items.push({
        medicineId: medicine.id,
        medicineName: medicine.name,
        expectedQuantity: medicine.stock,
        actualQuantity: medicine.stock,
        unitCost: medicine.costPrice
      });
    });

    const newStockTake = createStockTake(items);
    setCurrentStockTake(newStockTake);
    setShowStockTakeModal(true);
  };

  const handleActualQuantityChange = (itemId: string, value: string) => {
    if (!currentStockTake) return;
    const actualQuantity = parseInt(value) || 0;
    updateStockTakeItem(currentStockTake.id, itemId, actualQuantity);
    const updated = stockTakes.find(st => st.id === currentStockTake.id);
    if (updated) setCurrentStockTake(updated);
  };

  const handleConfirmStockTake = () => {
    if (!currentStockTake) return;
    const success = confirmStockTake(currentStockTake.id);
    if (success) {
      setShowStockTakeModal(false);
      setCurrentStockTake(null);
    }
  };

  const inventoryColumns: Column<Medicine>[] = [
    {
      key: 'name',
      header: '药品名称',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.specification}</p>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      header: '分类',
      render: (value) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
          {CATEGORY_LABELS[value as keyof typeof CATEGORY_LABELS]}
        </span>
      )
    },
    {
      key: 'stock',
      header: '库存状态',
      render: (_, row) => {
        const stockPercentage = (row.stock / row.safetyStock) * 100;
        const level = getStockAlertLevel(stockPercentage);
        return (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{row.stock} {row.unit}</span>
              <span className="text-xs text-slate-500">安全: {row.safetyStock} {row.unit}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  level === 'critical' ? 'bg-red-500' :
                  level === 'warning' ? 'bg-orange-500' : 'bg-green-500'
                )}
                style={{ width: `${Math.min(100, stockPercentage)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'expiryDate',
      header: '有效期',
      render: (_, row) => {
        const days = daysToExpiry(row.expiryDate);
        const level = getExpiryAlertLevel(days);
        return (
          <div>
            <p className="font-medium">{formatDate(row.expiryDate)}</p>
            <span className={cn(
              'text-xs font-medium',
              level === 'critical' ? 'text-red-600' :
              level === 'warning' ? 'text-orange-600' : 'text-green-600'
            )}>
              {days > 0 ? `还剩 ${days} 天` : `已过期 ${Math.abs(days)} 天`}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: '操作',
      className: 'text-right',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openInboundModal(row);
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
        >
          <TrendingUp className="w-4 h-4" />
          入库
        </button>
      )
    }
  ];

  const recordColumns: Column<InventoryRecord>[] = [
    {
      key: 'medicineName',
      header: '药品名称',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'batchNumber',
      header: '批号',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'quantity',
      header: '入库数量',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'unitCost',
      header: '单价',
      render: (value) => <span>¥{Number(value).toFixed(2)}</span>
    },
    {
      key: 'expiryDate',
      header: '有效期至',
      render: (value) => formatDate(value as string)
    },
    {
      key: 'inboundDate',
      header: '入库时间',
      render: (value) => formatDate(value as string)
    }
  ];

  const batchColumns: Column<MedicineBatch>[] = [
    {
      key: 'medicineId',
      header: '药品名称',
      render: (value) => {
        const medicine = medicines.find(m => m.id === value);
        return <span className="font-medium">{medicine?.name || '-'}</span>;
      }
    },
    {
      key: 'batchNumber',
      header: '批号',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'productionDate',
      header: '生产日期',
      render: (value) => formatDate(value as string)
    },
    {
      key: 'expiryDate',
      header: '有效期至',
      render: (value) => {
        const days = daysToExpiry(value as string);
        const level = getExpiryAlertLevel(days);
        return (
          <div>
            <p className="font-medium">{formatDate(value as string)}</p>
            <span className={cn(
              'text-xs font-medium',
              level === 'critical' ? 'text-red-600' :
              level === 'warning' ? 'text-orange-600' : 'text-green-600'
            )}>
              {days > 0 ? `还剩 ${days} 天` : `已过期 ${Math.abs(days)} 天`}
            </span>
          </div>
        );
      }
    },
    {
      key: 'quantity',
      header: '库存数量',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'unitCost',
      header: '单位成本',
      render: (value) => <span>¥{Number(value).toFixed(2)}</span>
    },
    {
      key: 'inboundDate',
      header: '入库日期',
      render: (value) => formatDate(value as string)
    }
  ];

  const stockTakeColumns: Column<StockTake>[] = [
    {
      key: 'takeDate',
      header: '盘点日期',
      render: (value) => formatDate(value as string)
    },
    {
      key: 'status',
      header: '状态',
      render: (value) => (
        <span className={cn(
          'px-2 py-1 rounded text-xs font-medium',
          value === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
        )}>
          {value === 'draft' ? '草稿' : '已确认'}
        </span>
      )
    },
    {
      key: 'items',
      header: '盘点品种',
      render: (_, row) => `${row.items.length} 个品种`
    },
    {
      key: 'totalDifference',
      header: '盘盈/盘亏',
      render: (_, row) => (
        <span className={cn(
          'font-medium',
          row.totalDifference > 0 ? 'text-green-600' :
          row.totalDifference < 0 ? 'text-red-600' : 'text-slate-600'
        )}>
          {row.totalDifference > 0 ? '+' : ''}{row.totalDifference}
        </span>
      )
    },
    {
      key: 'totalDifferenceAmount',
      header: '盈亏金额',
      render: (_, row) => (
        <span className={cn(
          'font-medium',
          row.totalDifferenceAmount > 0 ? 'text-green-600' :
          row.totalDifferenceAmount < 0 ? 'text-red-600' : 'text-slate-600'
        )}>
          {row.totalDifferenceAmount > 0 ? '+' : ''}¥{row.totalDifferenceAmount.toFixed(2)}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: '创建时间',
      render: (value) => formatDate(value as string)
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">库存管理</h1>
          <p className="text-slate-500 mt-1">管理药品库存和入库记录</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={startStockTake}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/30"
          >
            <ClipboardCheck className="w-5 h-5" />
            新建盘点
          </button>
          <button
            onClick={() => openInboundModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium shadow-lg shadow-orange-500/30"
          >
            <Plus className="w-5 h-5" />
            新增入库
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex border-b border-slate-200">
          {[
            { key: 'status', label: '库存状态' },
            { key: 'batches', label: '批次明细' },
            { key: 'records', label: '入库记录' },
            { key: 'stocktake', label: '盘点历史' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'px-6 py-3 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'status' && (
            <DataTable
              columns={inventoryColumns}
              data={medicines}
              emptyMessage="暂无药品数据"
            />
          )}
          {activeTab === 'batches' && (
            <DataTable
              columns={batchColumns}
              data={batches}
              emptyMessage="暂无批次数据"
            />
          )}
          {activeTab === 'records' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="搜索药品或批号..."
                  className="w-64"
                />
              </div>
              <DataTable
                columns={recordColumns}
                data={filteredRecords}
                emptyMessage="暂无入库记录"
              />
            </div>
          )}
          {activeTab === 'stocktake' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <SearchInput
                  value={stockTakeSearch}
                  onChange={setStockTakeSearch}
                  placeholder="搜索日期或备注..."
                  className="w-64"
                />
              </div>
              <DataTable
                columns={stockTakeColumns}
                data={filteredStockTakes}
                emptyMessage="暂无盘点记录"
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showInboundModal}
        onClose={() => setShowInboundModal(false)}
        title="药品入库"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              选择药品 <span className="text-red-500">*</span>
            </label>
            <select
              value={inboundForm.medicineId}
              onChange={(e) => {
                const medicine = medicines.find(m => m.id === e.target.value);
                setInboundForm(prev => ({
                  ...prev,
                  medicineId: e.target.value,
                  unitCost: medicine?.costPrice || 0,
                  productionDate: medicine?.productionDate || '',
                  expiryDate: medicine?.expiryDate || ''
                }));
              }}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">请选择药品</option>
              {medicines.map(m => (
                <option key={m.id} value={m.id}>{m.name} - {m.specification}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                入库数量 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={inboundForm.quantity}
                onChange={(e) => setInboundForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                进价 (元) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inboundForm.unitCost}
                onChange={(e) => setInboundForm(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              批号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={inboundForm.batchNumber}
              onChange={(e) => setInboundForm(prev => ({ ...prev, batchNumber: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="请输入批号"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                生产日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={inboundForm.productionDate}
                onChange={(e) => setInboundForm(prev => ({ ...prev, productionDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                有效期至 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={inboundForm.expiryDate}
                onChange={(e) => setInboundForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowInboundModal(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleInboundSubmit}
              disabled={!inboundForm.medicineId || !inboundForm.batchNumber}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              确认入库
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showStockTakeModal}
        onClose={() => setShowStockTakeModal(false)}
        title="库存盘点"
        size="xl"
      >
        {currentStockTake && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500">盘点日期</p>
                <p className="font-semibold text-lg">{formatDate(currentStockTake.takeDate)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500">盈亏数量</p>
                <p className={cn(
                  'font-semibold text-lg',
                  currentStockTake.totalDifference > 0 ? 'text-green-600' :
                  currentStockTake.totalDifference < 0 ? 'text-red-600' : 'text-slate-600'
                )}>
                  {currentStockTake.totalDifference > 0 ? '+' : ''}{currentStockTake.totalDifference}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500">盈亏金额</p>
                <p className={cn(
                  'font-semibold text-lg',
                  currentStockTake.totalDifferenceAmount > 0 ? 'text-green-600' :
                  currentStockTake.totalDifferenceAmount < 0 ? 'text-red-600' : 'text-slate-600'
                )}>
                  {currentStockTake.totalDifferenceAmount > 0 ? '+' : ''}¥{currentStockTake.totalDifferenceAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg max-h-96 overflow-auto">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">药品名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">批号</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">系统库存</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">实盘数量</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">盈亏</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">盈亏金额</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentStockTake.items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.medicineName}</p>
                        {item.batchNumber && (
                          <p className="text-xs text-slate-500 font-mono">{item.batchNumber}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{item.batchNumber || '-'}</td>
                      <td className="px-4 py-3 text-center font-medium">{item.expectedQuantity}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.actualQuantity}
                          onChange={(e) => handleActualQuantityChange(item.id, e.target.value)}
                          className="w-24 px-2 py-1.5 border border-slate-200 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </td>
                      <td className={cn(
                        'px-4 py-3 text-center font-medium',
                        item.difference > 0 ? 'text-green-600' :
                        item.difference < 0 ? 'text-red-600' : 'text-slate-600'
                      )}>
                        {item.difference > 0 ? '+' : ''}{item.difference}
                      </td>
                      <td className={cn(
                        'px-4 py-3 text-right font-medium',
                        item.differenceAmount > 0 ? 'text-green-600' :
                        item.differenceAmount < 0 ? 'text-red-600' : 'text-slate-600'
                      )}>
                        {item.differenceAmount > 0 ? '+' : ''}¥{item.differenceAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                备注
              </label>
              <textarea
                value={currentStockTake.remark}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                rows={2}
                placeholder="盘点备注"
              />
            </div>

            {currentStockTake.items.some(i => i.difference !== 0) && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">存在盈亏差异</p>
                  <p className="text-sm text-amber-700 mt-1">确认后将自动调整药品总库存和对应批次库存，请仔细核对实盘数量。</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowStockTakeModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmStockTake}
                disabled={currentStockTake.status !== 'draft'}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                确认盘点
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
