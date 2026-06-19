import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Medicine,
  Supplier,
  Sale,
  Promotion,
  InventoryRecord,
  SaleItem,
  ExpiryAlert,
  StockAlert,
  DailySales,
  TopSeller,
  PromotionEffect
} from '../types';
import {
  daysToExpiry,
  getExpiryAlertLevel,
  getStockAlertLevel,
  getTodayString
} from '../utils/date';
import { getDailySales as calcDailySales, getTopSellers as calcTopSellers } from '../utils/statistics';
import { calculatePromotionEffect } from '../utils/statistics';
import { mockMedicines, mockSuppliers, mockSales, mockPromotions, mockInventoryRecords } from '../mock/initData';

interface AppState {
  medicines: Medicine[];
  suppliers: Supplier[];
  sales: Sale[];
  promotions: Promotion[];
  inventoryRecords: InventoryRecord[];
  
  loadData: () => void;
  
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMedicine: (id: string, data: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  createSale: (items: SaleItem[], promotionId?: string, remark?: string) => Sale | null;
  validateStock: (items: SaleItem[]) => { valid: boolean; errors: string[] };
  
  addInventory: (record: Omit<InventoryRecord, 'id'>) => void;
  
  addPromotion: (promotion: Omit<Promotion, 'id'>) => void;
  updatePromotion: (id: string, data: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  togglePromotion: (id: string) => void;
  
  getExpiryAlerts: (days?: number) => ExpiryAlert[];
  getStockAlerts: () => StockAlert[];
  getDailySales: (date?: string) => DailySales;
  getTopSellers: (period: 'week' | 'month' | 'all', limit?: number) => TopSeller[];
  getPromotionEffect: (promotionId: string) => PromotionEffect;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      medicines: [],
      suppliers: [],
      sales: [],
      promotions: [],
      inventoryRecords: [],
      
      loadData: () => {
        const { medicines, suppliers, sales, promotions, inventoryRecords } = get();
        if (medicines.length === 0) {
          set({
            medicines: mockMedicines,
            suppliers: mockSuppliers,
            sales: mockSales,
            promotions: mockPromotions,
            inventoryRecords: mockInventoryRecords
          });
        }
      },
      
      addMedicine: (medicine) => {
        const now = new Date().toISOString();
        const newMedicine: Medicine = {
          ...medicine,
          id: 'med-' + generateId(),
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({
          medicines: [...state.medicines, newMedicine]
        }));
      },
      
      updateMedicine: (id, data) => {
        set((state) => ({
          medicines: state.medicines.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
          )
        }));
      },
      
      deleteMedicine: (id) => {
        set((state) => ({
          medicines: state.medicines.filter((m) => m.id !== id)
        }));
      },
      
      addSupplier: (supplier) => {
        const newSupplier: Supplier = {
          ...supplier,
          id: 'sup-' + generateId(),
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          suppliers: [...state.suppliers, newSupplier]
        }));
      },
      
      updateSupplier: (id, data) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...data } : s
          )
        }));
      },
      
      deleteSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id)
        }));
      },
      
      validateStock: (items) => {
        const { medicines } = get();
        const errors: string[] = [];
        
        items.forEach((item) => {
          const medicine = medicines.find((m) => m.id === item.medicineId);
          if (!medicine) {
            errors.push(`药品 ${item.medicineName} 不存在`);
          } else if (medicine.stock < item.totalQuantity) {
            errors.push(
              `${medicine.name} 库存不足，需要 ${item.totalQuantity} ${medicine.unit}，实际只有 ${medicine.stock} ${medicine.unit}`
            );
          }
        });
        
        return { valid: errors.length === 0, errors };
      },
      
      createSale: (items, promotionId, remark = '') => {
        const { medicines, updateMedicine, validateStock } = get();
        
        const validation = validateStock(items);
        if (!validation.valid) {
          return null;
        }
        
        const now = new Date().toISOString();
        
        items.forEach((item) => {
          const medicine = medicines.find((m) => m.id === item.medicineId);
          if (medicine) {
            updateMedicine(item.medicineId, {
              stock: medicine.stock - item.totalQuantity
            });
          }
        });
        
        const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
        const totalProfit = items.reduce((sum, item) => sum + item.profit, 0);
        
        const newSale: Sale = {
          id: 'sale-' + generateId(),
          saleTime: now,
          totalAmount,
          totalProfit,
          promotionId,
          remark,
          items
        };
        
        set((state) => ({
          sales: [newSale, ...state.sales]
        }));
        
        return newSale;
      },
      
      addInventory: (record) => {
        const { updateMedicine, medicines } = get();
        const medicine = medicines.find((m) => m.id === record.medicineId);
        
        const newRecord: InventoryRecord = {
          ...record,
          id: 'inv-' + generateId()
        };
        
        if (medicine) {
          updateMedicine(record.medicineId, {
            stock: medicine.stock + record.quantity,
            productionDate: record.productionDate,
            expiryDate: record.expiryDate
          });
        }
        
        set((state) => ({
          inventoryRecords: [newRecord, ...state.inventoryRecords]
        }));
      },
      
      addPromotion: (promotion) => {
        const { medicines } = get();
        const medicine = medicines.find((m) => m.id === promotion.medicineId);
        
        const newPromotion: Promotion = {
          ...promotion,
          id: 'promo-' + generateId(),
          medicineName: medicine?.name
        };
        set((state) => ({
          promotions: [...state.promotions, newPromotion]
        }));
      },
      
      updatePromotion: (id, data) => {
        const { medicines } = get();
        set((state) => ({
          promotions: state.promotions.map((p) => {
            if (p.id === id) {
              const medicine = medicines.find((m) => m.id === data.medicineId || p.medicineId);
              return { ...p, ...data, medicineName: medicine?.name || p.medicineName };
            }
            return p;
          })
        }));
      },
      
      togglePromotion: (id) => {
        set((state) => ({
          promotions: state.promotions.map((p) =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
          )
        }));
      },
      
      deletePromotion: (id) => {
        set((state) => ({
          promotions: state.promotions.filter((p) => p.id !== id)
        }));
      },
      
      getExpiryAlerts: (days = 30) => {
        const { medicines } = get();
        return medicines
          .map((medicine) => {
            const daysRemaining = daysToExpiry(medicine.expiryDate);
            return {
              medicine,
              daysRemaining,
              level: getExpiryAlertLevel(daysRemaining)
            };
          })
          .filter((alert) => alert.daysRemaining <= days)
          .sort((a, b) => a.daysRemaining - b.daysRemaining);
      },
      
      getStockAlerts: () => {
        const { medicines } = get();
        return medicines
          .filter((m) => m.safetyStock > 0)
          .map((medicine) => {
            const stockPercentage = (medicine.stock / medicine.safetyStock) * 100;
            return {
              medicine,
              stockPercentage,
              level: getStockAlertLevel(stockPercentage)
            };
          })
          .filter((alert) => alert.stockPercentage <= 100)
          .sort((a, b) => a.stockPercentage - b.stockPercentage);
      },
      
      getDailySales: (date) => {
        const { sales } = get();
        return calcDailySales(sales, date || getTodayString());
      },
      
      getTopSellers: (period, limit = 10) => {
        const { sales, medicines } = get();
        return calcTopSellers(sales, medicines, period, limit);
      },
      
      getPromotionEffect: (promotionId) => {
        const { sales, promotions } = get();
        const promotion = promotions.find((p) => p.id === promotionId);
        if (!promotion) {
          return { normalSales: 0, promotionSales: 0, increaseRate: 0 };
        }
        return calculatePromotionEffect(sales, promotion);
      }
    }),
    {
      name: 'pharmacy-storage'
    }
  )
);
