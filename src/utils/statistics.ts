import { Sale, Promotion, Medicine } from '../types';
import { daysBetween, getStartOfPeriod, isDateInRange } from './date';

export function aggregateSalesByPeriod(
  sales: Sale[],
  period: 'day' | 'week' | 'month'
): Array<{ period: string; amount: number; profit: number }> {
  const map = new Map<string, { amount: number; profit: number }>();
  
  sales.forEach(sale => {
    const date = new Date(sale.saleTime);
    let key: string;
    
    if (period === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekStart = new Date(date);
      const day = weekStart.getDay() || 7;
      weekStart.setDate(weekStart.getDate() - day + 1);
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    const existing = map.get(key) || { amount: 0, profit: 0 };
    map.set(key, {
      amount: existing.amount + sale.totalAmount,
      profit: existing.profit + sale.totalProfit
    });
  });
  
  return Array.from(map.entries())
    .map(([period, data]) => ({ period, ...data }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function calculateProfitRate(costPrice: number, salePrice: number): number {
  if (costPrice === 0) return 0;
  return ((salePrice - costPrice) / costPrice) * 100;
}

export function calculatePromotionEffect(
  sales: Sale[],
  promotion: Promotion
): { normalSales: number; promotionSales: number; increaseRate: number } {
  const promotionSales = sales
    .filter(s => s.promotionId === promotion.id)
    .reduce((sum, s) => sum + s.items.reduce((qty, item) => qty + item.totalQuantity, 0), 0);
  
  const promotionDays = daysBetween(new Date(promotion.startDate), new Date(promotion.endDate)) + 1;
  
  const beforePromotion = sales.filter(s => 
    new Date(s.saleTime) < new Date(promotion.startDate)
  );
  
  let normalSales = 0;
  if (beforePromotion.length > 0) {
    const firstSale = beforePromotion[0];
    const days = Math.max(daysBetween(new Date(firstSale.saleTime), new Date(promotion.startDate)), 1);
    const totalBefore = beforePromotion.reduce((sum, s) => 
      sum + s.items.reduce((qty, item) => {
        if (promotion.medicineId && item.medicineId === promotion.medicineId) {
          return qty + item.totalQuantity;
        }
        return qty;
      }, 0), 0
    );
    normalSales = (totalBefore / days) * promotionDays;
  }
  
  const increaseRate = normalSales > 0 ? ((promotionSales - normalSales) / normalSales) * 100 : 0;
  
  return { normalSales: Math.round(normalSales), promotionSales, increaseRate };
}

export function getTopSellers(
  sales: Sale[],
  medicines: Medicine[],
  period: 'week' | 'month' | 'all',
  limit: number = 10
): Array<{ medicine: Medicine; quantity: number; amount: number; profit: number }> {
  const startDate = period === 'all' ? '1970-01-01' : getStartOfPeriod(period);
  
  const medicineStats = new Map<string, { quantity: number; amount: number; profit: number }>();
  
  sales.forEach(sale => {
    if (sale.saleTime >= startDate) {
      sale.items.forEach(item => {
        const existing = medicineStats.get(item.medicineId) || { quantity: 0, amount: 0, profit: 0 };
        medicineStats.set(item.medicineId, {
          quantity: existing.quantity + item.totalQuantity,
          amount: existing.amount + item.subtotal,
          profit: existing.profit + item.profit
        });
      });
    }
  });
  
  return Array.from(medicineStats.entries())
    .map(([medicineId, stats]) => ({
      medicine: medicines.find(m => m.id === medicineId)!,
      ...stats
    }))
    .filter(item => item.medicine)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

export function getDailySales(
  sales: Sale[],
  date: string
): { amount: number; count: number; profit: number } {
  const daySales = sales.filter(s => s.saleTime.startsWith(date));
  return {
    amount: daySales.reduce((sum, s) => sum + s.totalAmount, 0),
    count: daySales.length,
    profit: daySales.reduce((sum, s) => sum + s.totalProfit, 0)
  };
}
