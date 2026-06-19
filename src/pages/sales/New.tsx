import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Check, Tag, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { SaleItem, Medicine, Promotion } from '../../types';
import { findActivePromotion, calculatePromotionPrice, getPromotionDescription } from '../../utils/promotion';
import { cn } from '../../lib/utils';
import SearchInput from '../../components/SearchInput';

interface CartItem {
  medicine: Medicine;
  payQuantity: number;
  promotion: Promotion | null;
}

export default function NewSale() {
  const navigate = useNavigate();
  const { medicines, promotions, createSale } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [remark, setRemark] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.specification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (medicine: Medicine) => {
    const existing = cart.find(item => item.medicine.id === medicine.id);
    const promotion = findActivePromotion(medicine.id, promotions);
    
    if (existing) {
      const nextPayQty = existing.payQuantity + 1;
      const promoResult = calculatePromotionPrice(medicine, nextPayQty, promotion);
      if (promoResult.totalQuantity <= medicine.stock) {
        setCart(cart.map(item =>
          item.medicine.id === medicine.id
            ? { ...item, payQuantity: nextPayQty }
            : item
        ));
        setErrorMessage('');
      }
    } else {
      if (medicine.stock > 0) {
        setCart([...cart, { medicine, payQuantity: 1, promotion }]);
        setErrorMessage('');
      }
    }
  };

  const updateQuantity = (medicineId: string, payQuantity: number) => {
    const item = cart.find(i => i.medicine.id === medicineId);
    if (!item) return;
    
    if (payQuantity <= 0) {
      setCart(cart.filter(i => i.medicine.id !== medicineId));
      setErrorMessage('');
    } else {
      const promoResult = calculatePromotionPrice(item.medicine, payQuantity, item.promotion);
      if (promoResult.totalQuantity <= item.medicine.stock) {
        setCart(cart.map(i =>
          i.medicine.id === medicineId ? { ...i, payQuantity } : i
        ));
        setErrorMessage('');
      }
    }
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter(i => i.medicine.id !== medicineId));
    setErrorMessage('');
  };

  const cartCalculation = useMemo(() => {
    let totalOriginal = 0;
    let totalDiscount = 0;
    let totalAmount = 0;
    let totalProfit = 0;
    const items: SaleItem[] = [];

    cart.forEach(cartItem => {
      const { medicine, payQuantity, promotion } = cartItem;
      const promoResult = calculatePromotionPrice(medicine, payQuantity, promotion);

      items.push({
        id: Math.random().toString(36).substring(2, 15),
        medicineId: medicine.id,
        medicineName: medicine.name,
        payQuantity: promoResult.payQuantity,
        freeQuantity: promoResult.freeQuantity,
        totalQuantity: promoResult.totalQuantity,
        unitPrice: medicine.salePrice,
        originalAmount: promoResult.originalAmount,
        discountAmount: promoResult.discountAmount,
        subtotal: promoResult.finalAmount,
        costAmount: promoResult.costAmount,
        profit: promoResult.profit,
        batchDeductions: []
      });

      totalOriginal += promoResult.originalAmount;
      totalDiscount += promoResult.discountAmount;
      totalAmount += promoResult.finalAmount;
      totalProfit += promoResult.profit;
    });

    return { items, totalOriginal, totalDiscount, totalAmount, totalProfit };
  }, [cart]);

  const handleSubmit = () => {
    if (cart.length === 0) return;
    
    const activePromotion = cart.find(i => i.promotion)?.promotion;
    const result = createSale(cartCalculation.items, activePromotion?.id, remark);
    
    if (result) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/sales');
      }, 1500);
    } else {
      setErrorMessage('库存不足，无法完成销售');
    }
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
                const cartTotalQty = inCart 
                  ? calculatePromotionPrice(medicine, inCart.payQuantity, promotion).totalQuantity 
                  : 0;
                
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
                        <div className="text-right">
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            购买 {inCart.payQuantity}
                          </span>
                          {promotion && calculatePromotionPrice(medicine, inCart.payQuantity, promotion).freeQuantity > 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                              赠 {calculatePromotionPrice(medicine, inCart.payQuantity, promotion).freeQuantity}
                            </p>
                          )}
                        </div>
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

            <div className="p-4 max-h-[350px] overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-slate-400 py-8">请选择药品</p>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => {
                    const promoResult = calculatePromotionPrice(item.medicine, item.payQuantity, item.promotion);
                    return (
                      <div key={item.medicine.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.medicine.name}</p>
                          <p className="text-xs text-slate-500">¥{item.medicine.salePrice.toFixed(2)} / {item.medicine.unit}</p>
                          {item.promotion && promoResult.freeQuantity > 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                              <Tag className="w-3 h-3 inline mr-1" />
                              买{item.promotion.buyQuantity}送{item.promotion.freeQuantity}，赠{promoResult.freeQuantity}{item.medicine.unit}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.medicine.id, item.payQuantity - 1);
                              }}
                              className="w-7 h-7 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.payQuantity}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.medicine.id, item.payQuantity + 1);
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
                    );
                  })}
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
                  <span className="text-slate-500">商品原价</span>
                  <span>¥{cartCalculation.totalOriginal.toFixed(2)}</span>
                </div>
                {cartCalculation.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>优惠减免</span>
                    <span>-¥{cartCalculation.totalDiscount.toFixed(2)}</span>
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

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

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
