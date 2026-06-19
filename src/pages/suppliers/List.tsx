import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Phone, MapPin, User, Building2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import DataTable, { Column } from '../../components/DataTable';
import SearchInput from '../../components/SearchInput';
import Modal from '../../components/Modal';
import { Supplier } from '../../types';
import { formatDate } from '../../utils/date';

export default function SupplierList() {
  const navigate = useNavigate();
  const { suppliers, deleteSupplier, medicines } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<Supplier | null>(null);
  const [formModal, setFormModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    address: '',
    remark: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  const openFormModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact: supplier.contact,
        phone: supplier.phone,
        address: supplier.address,
        remark: supplier.remark
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contact: '',
        phone: '',
        address: '',
        remark: ''
      });
    }
    setErrors({});
    setFormModal(true);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '请输入供应商名称';
    if (!formData.contact.trim()) newErrors.contact = '请输入联系人';
    if (!formData.phone.trim()) newErrors.phone = '请输入联系电话';
    if (!formData.address.trim()) newErrors.address = '请输入地址';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    if (editingSupplier) {
      useStore.getState().updateSupplier(editingSupplier.id, formData);
    } else {
      useStore.getState().addSupplier(formData);
    }
    setFormModal(false);
  };

  const handleDelete = (supplier: Supplier) => {
    deleteSupplier(supplier.id);
    setDeleteModal(null);
  };

  const getMedicineCount = (supplierId: string) => {
    return medicines.filter(m => m.supplierId === supplierId).length;
  };

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: '供应商名称',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">供应 {getMedicineCount(row.id)} 种药品</p>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      header: '联系人',
      render: (value) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'phone',
      header: '联系电话',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-slate-400" />
          <a href={`tel:${value}`} className="text-blue-600 hover:underline">{value}</a>
        </div>
      )
    },
    {
      key: 'address',
      header: '地址',
      render: (value) => (
        <div className="flex items-start gap-2 max-w-xs">
          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm truncate">{value as string}</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: '添加时间',
      render: (value) => formatDate(value as string)
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
              openFormModal(row);
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
          <h1 className="text-2xl font-bold text-slate-900">供应商管理</h1>
          <p className="text-slate-500 mt-1">管理供应商信息</p>
        </div>
        <button
          onClick={() => openFormModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg shadow-purple-500/30"
        >
          <Plus className="w-5 h-5" />
          新增供应商
        </button>
      </div>

      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="搜索供应商名称、联系人或电话..."
      />

      <DataTable
        columns={columns}
        data={filteredSuppliers}
        emptyMessage="暂无供应商数据"
      />

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="确认删除"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            确定要删除供应商 <span className="font-semibold text-slate-900">{deleteModal?.name}</span> 吗？此操作不可撤销。
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

      <Modal
        isOpen={formModal}
        onClose={() => setFormModal(false)}
        title={editingSupplier ? '编辑供应商' : '新增供应商'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                供应商名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder="请输入供应商名称"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                联系人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.contact ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder="请输入联系人姓名"
              />
              {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              联系电话 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.phone ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
              placeholder="请输入联系电话"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.address ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
              placeholder="请输入详细地址"
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              备注
            </label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              rows={3}
              placeholder="输入备注信息"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => setFormModal(false)}
              className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              {editingSupplier ? '保存修改' : '添加供应商'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
