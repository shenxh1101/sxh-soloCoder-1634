import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Pill } from 'lucide-react';
import { useStore } from '../../store/useStore';
import DataTable, { Column } from '../../components/DataTable';
import SearchInput from '../../components/SearchInput';
import Modal from '../../components/Modal';
import { Medicine, CATEGORY_LABELS } from '../../types';
import { formatDate, daysToExpiry, getExpiryAlertLevel } from '../../utils/date';
import { cn } from '../../lib/utils';

export default function MedicineList() {
  const navigate = useNavigate();
  const { medicines, deleteMedicine, suppliers } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<Medicine | null>(null);

  const filteredMedicines = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.specification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (medicine: Medicine) => {
    deleteMedicine(medicine.id);
    setDeleteModal(null);
  };

  const columns: Column<Medicine>[] = [
    {
      key: 'name',
      header: '药品名称',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Pill className="w-5 h-5 text-blue-600" />
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
      header: '库存',
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.stock} {row.unit}</p>
          <p className="text-xs text-slate-500">安全库存: {row.safetyStock} {row.unit}</p>
        </div>
      )
    },
    {
      key: 'expiryDate',
      header: '有效期',
      render: (value, row) => {
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
      key: 'salePrice',
      header: '售价',
      render: (value) => <span className="font-medium">¥{Number(value).toFixed(2)}</span>
    },
    {
      key: 'supplierId',
      header: '供应商',
      render: (value) => {
        const supplier = suppliers.find(s => s.id === value);
        return <span>{supplier?.name || '-'}</span>;
      }
    },
    {
      key: 'actions',
      header: '操作',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/medicines/${row.id}/edit`);
            }}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal(row);
            }}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">药品管理</h1>
          <p className="text-slate-500 mt-1">管理所有药品信息</p>
        </div>
        <button
          onClick={() => navigate('/medicines/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" />
          新增药品
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索药品名称或规格..."
          className="flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="all">全部分类</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredMedicines}
        emptyMessage="暂无药品数据"
        onRowClick={(row) => navigate(`/medicines/${row.id}/edit`)}
      />

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="确认删除"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            确定要删除药品 <span className="font-semibold text-slate-900">{deleteModal?.name}</span> 吗？此操作不可撤销。
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteModal(null)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => deleteModal && handleDelete(deleteModal)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              确认删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
