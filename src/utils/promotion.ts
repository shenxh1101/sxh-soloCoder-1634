import { Promotion, Medicine } from '../types';
import { isDateInRange, getTodayString } from './date';

export function isPromotionActive(promotion: Promotion, date: Date = new Date()): boolean {
  if (!promotion.isActive) return false;
  const dateStr = date.toISOString().split('T')[0];
  return isDateInRange(dateStr, promotion.startDate, promotion.endDate);
}

export function calculatePromotionPrice(
  medicine: Medicine,
  quantity: number,
  promotion: Promotion
): { finalQuantity: number; finalPrice: number; freeQuantity: number; actualPayQuantity: number } {
  if (promotion.type === 'buy_n_get_m') {
    const { buyQuantity, freeQuantity } = promotion;
    const groups = Math.floor(quantity / buyQuantity);
    const freeQty = groups * freeQuantity;
    const actualPayQty = quantity;
    const finalQty = quantity + freeQty;
    const finalPrice = actualPayQty * medicine.salePrice;
    return { finalQuantity: finalQty, finalPrice, freeQuantity: freeQty, actualPayQuantity: actualPayQty };
  } else {
    const { discountRate } = promotion;
    const finalPrice = quantity * medicine.salePrice * (discountRate / 100);
    return { finalQuantity: quantity, finalPrice, freeQuantity: 0, actualPayQuantity: quantity };
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
