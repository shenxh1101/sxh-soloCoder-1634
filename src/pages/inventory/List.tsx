import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Package } from 'lucide-react';
import { useStore } from '../../store/useStore';
import DataTable, { Column } from '../../components/DataTable';
import SearchInput from '../../components/SearchInput';
import Modal from '../../components/Modal';
import { InventoryRecord, Medicine, MedicineBatch, CATEGORY_LABELS } from '../../types';
import { formatDate, daysToExpiry, getExpiryAlertLevel, getStockAlertLevel } from '../../utils/date';
import { cn } from '../../lib/utils';

export default function InventoryList() {
  const navigate = useNavigate();
  const { medicines, inventoryRecords, batches, addInventory } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [inboundForm, setInboundForm] = useState({
    medicineId: '',
    quantity: 10,
    unitCost: 0,
    productionDate: '',
    expiryDate: '',
    batchNumber: ''
  });

  const filteredRecords = inventoryRecords.filter(r => {
    const medicine = medicines.find(m => m.id === r.medicineId);
    if (!medicine) return false;
    return medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           r.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">库存管理</h1>
          <p className="text-slate-500 mt-1">管理药品库存和入库记录</p>
        </div>
        <button
          onClick={() => openInboundModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium shadow-lg shadow-orange-500/30"
        >
          <Plus className="w-5 h-5" />
          新增入库
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">库存状态</h2>
        <DataTable
          columns={inventoryColumns}
          data={medicines}
          emptyMessage="暂无药品数据"
        />
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">批次明细</h2>
        <DataTable
          columns={batchColumns}
          data={batches}
          emptyMessage="暂无批次数据"
        />
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">入库记录</h2>
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
    </div>
  );
}
