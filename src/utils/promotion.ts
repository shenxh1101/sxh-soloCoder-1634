import { Promotion, Medicine } from '../types';
import { isDateInRange, getTodayString } from './date';

export function isPromotionActive(promotion: Promotion, date: Date = new Date()): boolean {
  if (!promotion.isActive) return false;
  const dateStr = date.toISOString().split('T')[0];
  return isDateInRange(dateStr, promotion.startDate, promotion.endDate);
}

export interface PromotionResult {
  payQuantity: number;
  freeQuantity: number;
  totalQuantity: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  costAmount: number;
  profit: number;
}

export function calculatePromotionPrice(
  medicine: Medicine,
  payQuantity: number,
  promotion: Promotion | null
): PromotionResult {
  const originalAmount = payQuantity * medicine.salePrice;
  
  if (!promotion) {
    return {
      payQuantity,
      freeQuantity: 0,
      totalQuantity: payQuantity,
      originalAmount,
      discountAmount: 0,
      finalAmount: originalAmount,
      costAmount: payQuantity * medicine.costPrice,
      profit: originalAmount - payQuantity * medicine.costPrice
    };
  }

  if (promotion.type === 'buy_n_get_m') {
    const { buyQuantity, freeQuantity: freeQtyPerGroup } = promotion;
    const groups = Math.floor(payQuantity / buyQuantity);
    const freeQty = groups * freeQtyPerGroup;
    const totalQty = payQuantity + freeQty;
    const finalAmount = payQuantity * medicine.salePrice;
    const costAmount = totalQty * medicine.costPrice;
    
    return {
      payQuantity,
      freeQuantity: freeQty,
      totalQuantity: totalQty,
      originalAmount: totalQty * medicine.salePrice,
      discountAmount: totalQty * medicine.salePrice - finalAmount,
      finalAmount,
      costAmount,
      profit: finalAmount - costAmount
    };
  } else {
    const { discountRate } = promotion;
    const finalAmount = payQuantity * medicine.salePrice * (discountRate / 100);
    const discountAmount = originalAmount - finalAmount;
    
    return {
      payQuantity,
      freeQuantity: 0,
      totalQuantity: payQuantity,
      originalAmount,
      discountAmount,
      finalAmount,
      costAmount: payQuantity * medicine.costPrice,
      profit: finalAmount - payQuantity * medicine.costPrice
    };
  }
}

export function findActivePromotion(medicineId: string, promotions: Promotion[]): Promotion | null {
  const today = getTodayString();
  return promotions.find(p => 
    p.medicineId === medicineId && 
    p.isActive && 
    isDateInRange(today, p.startDate, p.endDate)
  ) || null;
}

export function getPromotionDescription(promotion: Promotion): string {
  if (promotion.type === 'buy_n_get_m') {
    return `买${promotion.buyQuantity}送${promotion.freeQuantity}`;
  } else {
    return `${promotion.discountRate}折优惠`;
  }
}
