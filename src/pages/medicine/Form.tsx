import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Medicine, MedicineCategory, CATEGORY_LABELS } from '../../types';
import { getTodayString } from '../../utils/date';

export default function MedicineForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { medicines, suppliers, addMedicine, updateMedicine } = useStore();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    category: 'cold' as MedicineCategory,
    specification: '',
    productionDate: getTodayString(),
    expiryDate: getTodayString(),
    costPrice: 0,
    salePrice: 0,
    supplierId: '',
    stock: 0,
    safetyStock: 10,
    unit: '盒'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      const medicine = medicines.find(m => m.id === id);
      if (medicine) {
        setFormData({
          name: medicine.name,
          category: medicine.category,
          specification: medicine.specification,
          productionDate: medicine.productionDate,
          expiryDate: medicine.expiryDate,
          costPrice: medicine.costPrice,
          salePrice: medicine.salePrice,
          supplierId: medicine.supplierId,
          stock: medicine.stock,
          safetyStock: medicine.safetyStock,
          unit: medicine.unit
        });
      }
    }
  }, [isEdit, id, medicines]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '请输入药品名称';
    if (!formData.specification.trim()) newErrors.specification = '请输入规格';
    if (!formData.productionDate) newErrors.productionDate = '请选择生产日期';
    if (!formData.expiryDate) newErrors.expiryDate = '请选择有效期';
    if (new Date(formData.expiryDate) <= new Date(formData.productionDate)) {
      newErrors.expiryDate = '有效期必须晚于生产日期';
    }
    if (formData.costPrice <= 0) newErrors.costPrice = '请输入有效进价';
    if (formData.salePrice <= 0) newErrors.salePrice = '请输入有效售价';
    if (!formData.supplierId) newErrors.supplierId = '请选择供应商';
    if (formData.stock < 0) newErrors.stock = '库存不能为负数';
    if (formData.safetyStock <= 0) newErrors.safetyStock = '请输入有效安全库存';
    if (!formData.unit.trim()) newErrors.unit = '请输入单位';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit && id) {
      updateMedicine(id, formData);
    } else {
      addMedicine(formData);
    }
    navigate('/medicines');
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/medicines')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? '编辑药品' : '新增药品'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEdit ? '修改药品信息' : '添加新的药品'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              药品名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
              placeholder="请输入药品名称"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              分类 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              规格 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.specification}
              onChange={(e) => handleChange('specification', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.specification ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
              placeholder="例如：10g*15袋"
            />
            {errors.specification && <p className="text-red-500 text-xs mt-1">{errors.specification}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              单位 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.unit ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
              placeholder="例如：盒、瓶"
            />
            {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              生产日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.productionDate}
              onChange={(e) => handleChange('productionDate', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.productionDate ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {errors.productionDate && <p className="text-red-500 text-xs mt-1">{errors.productionDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              有效期至 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => handleChange('expiryDate', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.expiryDate ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              进价 (元) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.costPrice}
              onChange={(e) => handleChange('costPrice', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.costPrice ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              售价 (元) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.salePrice}
              onChange={(e) => handleChange('salePrice', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.salePrice ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {errors.salePrice && <p className="text-red-500 text-xs mt-1">{errors.salePrice}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              供应商 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => handleChange('supplierId', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.supplierId ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            >
              <option value="">请选择供应商</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.supplierId && <p className="text-red-500 text-xs mt-1">{errors.supplierId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              初始库存 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.stock ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              安全库存 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.safetyStock}
              onChange={(e) => handleChange('safetyStock', parseInt(e.target.value) || 0)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.safetyStock ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {errors.safetyStock && <p className="text-red-500 text-xs mt-1">{errors.safetyStock}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/medicines')}
            className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/30"
          >
            <Save className="w-5 h-5" />
            {isEdit ? '保存修改' : '添加药品'}
          </button>
        </div>
      </form>
    </div>
  );
}
