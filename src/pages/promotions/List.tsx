import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Tag, TrendingUp } from 'lucide-react';
import { useStore } from '../../store/useStore';
import DataTable, { Column } from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Promotion, PromotionType } from '../../types';
import { formatDate } from '../../utils/date';
import { getPromotionDescription, isPromotionActive } from '../../utils/promotion';
import { cn } from '../../lib/utils';

interface PromotionFormData {
  name: string;
  medicineId: string;
  type: PromotionType;
  buyQuantity: number;
  freeQuantity: number;
  discountRate: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function PromotionList() {
  const navigate = useNavigate();
  const { promotions, togglePromotion, deletePromotion, getPromotionEffect } = useStore();
  const [deleteModal, setDeleteModal] = useState<Promotion | null>(null);
  const [formModal, setFormModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    medicineId: '',
    type: 'buy_n_get_m',
    buyQuantity: 3,
    freeQuantity: 1,
    discountRate: 90,
    startDate: '',
    endDate: '',
    isActive: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openFormModal = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        name: promotion.name,
        medicineId: promotion.medicineId,
        type: promotion.type,
        buyQuantity: promotion.buyQuantity,
        freeQuantity: promotion.freeQuantity,
        discountRate: promotion.discountRate,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isActive: promotion.isActive
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        name: '',
        medicineId: '',
        type: 'buy_n_get_m',
        buyQuantity: 3,
        freeQuantity: 1,
        discountRate: 90,
        startDate: '',
        endDate: '',
        isActive: true
      });
    }
    setErrors({});
    setFormModal(true);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '请输入活动名称';
    if (!formData.medicineId) newErrors.medicineId = '请选择药品';
    if (!formData.startDate) newErrors.startDate = '请选择开始日期';
    if (!formData.endDate) newErrors.endDate = '请选择结束日期';
    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = '结束日期必须晚于开始日期';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    if (editingPromotion) {
      useStore.getState().updatePromotion(editingPromotion.id, formData);
    } else {
      useStore.getState().addPromotion(formData);
    }
    setFormModal(false);
  };

  const handleDelete = (promotion: Promotion) => {
    deletePromotion(promotion.id);
    setDeleteModal(null);
  };

  const columns: Column<Promotion>[] = [
    {
      key: 'name',
      header: '活动名称',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.medicineName}</p>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: '促销类型',
      render: (_, row) => (
        <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
          {getPromotionDescription(row)}
        </span>
      )
    },
    {
      key: 'dateRange',
      header: '活动时间',
      render: (_, row) => (
        <div>
          <p className="text-sm">{formatDate(row.startDate)} ~ {formatDate(row.endDate)}</p>
          <p className={cn(
            'text-xs',
            isPromotionActive(row) ? 'text-green-600' : 'text-slate-400'
          )}>
            {isPromotionActive(row) ? '进行中' : '未开始/已结束'}
          </p>
        </div>
      )
    },
    {
      key: 'effect',
      header: '促销效果',
      render: (_, row) => {
        const effect = getPromotionEffect(row.id);
        return (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-sm font-medium">
                {effect.promotionSales} 件
              </p>
              <p className={cn(
                'text-xs',
                effect.increaseRate >= 0 ? 'text-green-600' : 'text-red-500'
              )}>
                {effect.increaseRate >= 0 ? '+' : ''}{effect.increaseRate.toFixed(1)}%
              </p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'isActive',
      header: '状态',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePromotion(row.id);
          }}
          className="flex items-center gap-2"
        >
          {row.isActive ? (
            <>
              <ToggleRight className="w-6 h-6 text-green-500" />
              <span className="text-sm text-green-600">启用</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-6 h-6 text-slate-400" />
              <span className="text-sm text-slate-400">停用</span>
            </>
          )}
        </button>
      )
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

  const { medicines } = useStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">促销活动</h1>
          <p className="text-slate-500 mt-1">管理药品促销活动</p>
        </div>
        <button
          onClick={() => openFormModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium shadow-lg shadow-orange-500/30"
        >
          <Plus className="w-5 h-5" />
          新增活动
        </button>
      </div>

      <DataTable
        columns={columns}
        data={promotions}
        emptyMessage="暂无促销活动"
      />

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="确认删除"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            确定要删除促销活动 <span className="font-semibold text-slate-900">{deleteModal?.name}</span> 吗？此操作不可撤销。
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
        title={editingPromotion ? '编辑促销活动' : '新增促销活动'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              活动名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
              placeholder="例如：感冒灵买三送一"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              选择药品 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.medicineId}
              onChange={(e) => setFormData(prev => ({ ...prev, medicineId: e.target.value }))}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.medicineId ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            >
              <option value="">请选择药品</option>
              {medicines.map(m => (
                <option key={m.id} value={m.id}>{m.name} - {m.specification}</option>
              ))}
            </select>
            {errors.medicineId && <p className="text-red-500 text-xs mt-1">{errors.medicineId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              促销类型 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="buy_n_get_m"
                  checked={formData.type === 'buy_n_get_m'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PromotionType }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span>买N送M</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="discount"
                  checked={formData.type === 'discount'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PromotionType }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span>折扣</span>
              </label>
            </div>
          </div>

          {formData.type === 'buy_n_get_m' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  购买数量
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.buyQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyQuantity: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  赠送数量
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.freeQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, freeQuantity: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                折扣率 (%)
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={formData.discountRate}
                onChange={(e) => setFormData(prev => ({ ...prev, discountRate: parseInt(e.target.value) || 90 }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">例如：85 表示 85 折</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                开始日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.startDate ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                结束日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.endDate ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700">立即启用</label>
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
              className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover hover:bg-orange-700 transition-colors"
            >
              {editingPromotion ? '保存修改' : '创建活动'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
