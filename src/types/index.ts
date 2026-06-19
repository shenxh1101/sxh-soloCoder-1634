export type MedicineCategory = 'cold' | 'hypertension' | 'anti-inflammatory' | 'vitamin' | 'other';

export type PromotionType = 'buy_n_get_m' | 'discount';

export type AlertLevel = 'critical' | 'warning' | 'normal';

export interface Medicine {
  id: string;
  name: string;
  category: MedicineCategory;
  specification: string;
  productionDate: string;
  expiryDate: string;
  costPrice: number;
  salePrice: number;
  supplierId: string;
  stock: number;
  safetyStock: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  remark: string;
  createdAt: string;
}

export interface InventoryRecord {
  id: string;
  medicineId: string;
  medicineName?: string;
  quantity: number;
  unitCost: number;
  productionDate: string;
  expiryDate: string;
  batchNumber: string;
  inboundDate: string;
}

export interface SaleItem {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  profit: number;
  freeQuantity?: number;
}

export interface Sale {
  id: string;
  saleTime: string;
  totalAmount: number;
  totalProfit: number;
  promotionId?: string;
  remark: string;
  items: SaleItem[];
}

export interface Promotion {
  id: string;
  name: string;
  medicineId: string;
  medicineName?: string;
  type: PromotionType;
  buyQuantity: number;
  freeQuantity: number;
  discountRate: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ExpiryAlert {
  medicine: Medicine;
  daysRemaining: number;
  level: AlertLevel;
}

export interface StockAlert {
  medicine: Medicine;
  stockPercentage: number;
  level: AlertLevel;
}

export interface TopSeller {
  medicine: Medicine;
  quantity: number;
  amount: number;
  profit: number;
}

export interface DailySales {
  amount: number;
  count: number;
  profit: number;
}

export interface PromotionEffect {
  normalSales: number;
  promotionSales: number;
  increaseRate: number;
}

export const CATEGORY_LABELS: Record<MedicineCategory, string> = {
  cold: '感冒药',
  hypertension: '降压药',
  'anti-inflammatory': '消炎药',
  vitamin: '维生素',
  other: '其他'
};

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  buy_n_get_m: '买N送M',
  discount: '折扣'
};
