import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Check, Tag } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { SaleItem, Medicine, Promotion } from '../../types';
import { findActivePromotion, calculatePromotionPrice, getPromotionDescription } from '../../utils/promotion';
import { cn } from '../../lib/utils';
import SearchInput from '../../components/SearchInput';

interface CartItem {
  medicine: Medicine;
  quantity: number;
  promotion: Promotion | null;
}

export default function NewSale() {
  const navigate = useNavigate();
  const { medicines, promotions, createSale } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [remark, setRemark] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.specification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (medicine: Medicine) => {
    const existing = cart.find(item => item.medicine.id === medicine.id);
    if (existing) {
      if (existing.quantity < medicine.stock) {
        setCart(cart.map(item =>
          item.medicine.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      if (medicine.stock > 0) {
        const promotion = findActivePromotion(medicine.id, promotions);
        setCart([...cart, { medicine, quantity: 1, promotion }]);
      }
    }
  };

  const updateQuantity = (medicineId: string, quantity: number) => {
    const item = cart.find(i => i.medicine.id === medicineId);
    if (!item) return;
    
    if (quantity <= 0) {
      setCart(cart.filter(i => i.medicine.id !== medicineId));
    } else if (quantity <= item.medicine.stock) {
      setCart(cart.map(i =>
        i.medicine.id === medicineId ? { ...i, quantity } : i
      ));
    }
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter(i => i.medicine.id !== medicineId));
  };

  const cartCalculation = useMemo(() => {
    let totalAmount = 0;
    let totalProfit = 0;
    const items: SaleItem[] = [];
    let totalSaved = 0;

    cart.forEach(cartItem => {
      const { medicine, quantity, promotion } = cartItem;
      let unitPrice = medicine.salePrice;
      let subtotal = quantity * unitPrice;
      let freeQuantity = 0;

      if (promotion) {
        const promoResult = calculatePromotionPrice(medicine, quantity, promotion);
        subtotal = promoResult.finalPrice;
        freeQuantity = promoResult.freeQuantity;
        const originalPrice = (quantity + freeQuantity) * unitPrice;
        totalSaved += originalPrice - subtotal;
      }

      const profit = subtotal - quantity * medicine.costPrice;

      items.push({
        id: Math.random().toString(36).substring(2, 15),
        medicineId: medicine.id,
        medicineName: medicine.name,
        quantity,
        unitPrice,
        subtotal,
        profit,
        freeQuantity
      });

      totalAmount += subtotal;
      totalProfit += profit;
    });

    return { items, totalAmount, totalProfit, totalSaved };
  }, [cart]);

  const handleSubmit = () => {
    if (cart.length === 0) return;
    
    const activePromotion = cart.find(i => i.promotion)?.promotion;
    createSale(cartCalculation.items, activePromotion?.id, remark);
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate('/sales');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sales')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">新增销售</h1>
          <p className="text-slate-500 mt-1">录入销售订单</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索药品名称或规格..."
          />
          
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 max-h-[600px] overflow-y-auto">
              {filteredMedicines.map(medicine => {
                const inCart = cart.find(i => i.medicine.id === medicine.id);
                const promotion = findActivePromotion(medicine.id, promotions);
                
                return (
                  <div
                    key={medicine.id}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all cursor-pointer',
                      inCart
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50',
                      medicine.stock === 0 && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => medicine.stock > 0 && addToCart(medicine)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{medicine.name}</p>
                        <p className="text-xs text-slate-500">{medicine.specification}</p>
                        <p className="text-sm font-semibold text-green-600 mt-1">¥{medicine.salePrice.toFixed(2)}</p>
                        <p className={cn(
                          'text-xs mt-1',
                          medicine.stock <= medicine.safetyStock ? 'text-red-500' : 'text-slate-400'
                        )}>
                          库存: {medicine.stock} {medicine.unit}
                        </p>
                      </div>
                      {inCart && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                    {promotion && (
                      <div className="mt-2 flex items-center gap-1 text-orange-600 text-xs">
                        <Tag className="w-3 h-3" />
                        {getPromotionDescription(promotion)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 sticky top-6">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">购物车</h2>
                <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {cart.length} 种
                </span>
              </div>
            </div>

            <div className="p-4 max-h-[400px] overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-slate-400 py-8">请选择药品</p>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.medicine.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.medicine.name}</p>
                        <p className="text-xs text-slate-500">¥{item.medicine.salePrice.toFixed(2)} / {item.medicine.unit}</p>
                        {item.promotion && (
                          <p className="text-xs text-orange-600 mt-1">
                            <Tag className="w-3 h-3 inline mr-1" />
                            {getPromotionDescription(item.promotion)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.medicine.id, item.quantity - 1);
                            }}
                            className="w-7 h-7 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.medicine.id, item.quantity + 1);
                            }}
                            className="w-7 h-7 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.medicine.id);
                          }}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">备注</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  rows={2}
                  placeholder="输入备注信息"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">商品金额</span>
                  <span>¥{(cartCalculation.totalAmount + cartCalculation.totalSaved).toFixed(2)}</span>
                </div>
                {cartCalculation.totalSaved > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>优惠</span>
                    <span>-¥{cartCalculation.totalSaved.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                  <span>应付金额</span>
                  <span className="text-green-600">¥{cartCalculation.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-blue-600">
                  <span>预计利润</span>
                  <span>¥{cartCalculation.totalProfit.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || showSuccess}
                className={cn(
                  'w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                  cart.length === 0 || showSuccess
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/30'
                )}
              >
                {showSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    销售成功！
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    确认收款
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
