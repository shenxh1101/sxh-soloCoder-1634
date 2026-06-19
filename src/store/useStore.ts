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
  PromotionEffect,
  MedicineBatch,
  BatchDeduction,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus
} from '../types';
import {
  daysToExpiry,
  getExpiryAlertLevel,
  getStockAlertLevel,
  getTodayString
} from '../utils/date';
import { getDailySales as calcDailySales, getTopSellers as calcTopSellers } from '../utils/statistics';
import { calculatePromotionEffect } from '../utils/statistics';
import { mockMedicines, mockSuppliers, mockSales, mockPromotions, mockInventoryRecords, mockBatches, mockPurchaseOrders } from '../mock/initData';

interface AppState {
  medicines: Medicine[];
  suppliers: Supplier[];
  sales: Sale[];
  promotions: Promotion[];
  inventoryRecords: InventoryRecord[];
  batches: MedicineBatch[];
  purchaseOrders: PurchaseOrder[];

  loadData: () => void;

  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMedicine: (id: string, data: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  createSale: (items: SaleItem[], promotionId?: string, remark?: string) => Sale | null;
  validateStock: (items: SaleItem[]) => { valid: boolean; errors: string[] };
  refundSale: (saleId: string, remark?: string) => boolean;

  addInventory: (record: Omit<InventoryRecord, 'id'>) => void;

  addBatch: (batch: Omit<MedicineBatch, 'id'>) => void;
  updateBatch: (id: string, data: Partial<MedicineBatch>) => void;
  deleteBatch: (id: string) => void;
  getBatchesByMedicine: (medicineId: string) => MedicineBatch[];
  deductBatchStock: (medicineId: string, quantity: number) => BatchDeduction[];

  addPromotion: (promotion: Omit<Promotion, 'id'>) => void;
  updatePromotion: (id: string, data: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  togglePromotion: (id: string) => void;

  createPurchaseOrder: (items: Omit<PurchaseOrderItem, 'id'>[], supplierId: string, remark?: string) => PurchaseOrder;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrderStatus) => void;
  receivePurchaseOrder: (id: string) => void;

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
      batches: [],
      purchaseOrders: [],

      loadData: () => {
        const { medicines, suppliers, sales, promotions, inventoryRecords, batches, purchaseOrders } = get();
        if (medicines.length === 0) {
          set({
            medicines: mockMedicines,
            suppliers: mockSuppliers,
            sales: mockSales,
            promotions: mockPromotions,
            inventoryRecords: mockInventoryRecords,
            batches: mockBatches,
            purchaseOrders: mockPurchaseOrders
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

      getBatchesByMedicine: (medicineId) => {
        return get().batches
          .filter(b => b.medicineId === medicineId && b.quantity > 0)
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      },

      deductBatchStock: (medicineId, quantity) => {
        const { batches } = get();
        const sorted = [...batches]
          .filter(b => b.medicineId === medicineId && b.quantity > 0)
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        const deductions: BatchDeduction[] = [];
        let remaining = quantity;

        for (const batch of sorted) {
          if (remaining <= 0) break;
          const deduct = Math.min(batch.quantity, remaining);
          deductions.push({
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            quantity: deduct,
            unitCost: batch.unitCost
          });
          remaining -= deduct;
        }

        if (remaining > 0) return [];

        set((state) => ({
          batches: state.batches.map(b => {
            const deduction = deductions.find(d => d.batchId === b.id);
            if (deduction) {
              return { ...b, quantity: b.quantity - deduction.quantity };
            }
            return b;
          })
        }));

        return deductions;
      },

      addBatch: (batch) => {
        const newBatch: MedicineBatch = {
          ...batch,
          id: 'batch-' + generateId()
        };
        set((state) => ({
          batches: [...state.batches, newBatch]
        }));
      },

      updateBatch: (id, data) => {
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === id ? { ...b, ...data } : b
          )
        }));
      },

      deleteBatch: (id) => {
        set((state) => ({
          batches: state.batches.filter((b) => b.id !== id)
        }));
      },

      validateStock: (items) => {
        const { batches } = get();
        const errors: string[] = [];

        items.forEach((item) => {
          const availableBatches = batches.filter(b => b.medicineId === item.medicineId && b.quantity > 0);
          const totalAvailable = availableBatches.reduce((sum, b) => sum + b.quantity, 0);

          if (availableBatches.length === 0) {
            const medicine = get().medicines.find(m => m.id === item.medicineId);
            errors.push(`药品 ${item.medicineName} 无可用批次`);
          } else if (totalAvailable < item.totalQuantity) {
            const medicine = get().medicines.find(m => m.id === item.medicineId);
            errors.push(
              `${item.medicineName} 库存不足，需要 ${item.totalQuantity}，各批次合计只有 ${totalAvailable}`
            );
          }
        });

        return { valid: errors.length === 0, errors };
      },

      createSale: (items, promotionId, remark = '') => {
        const { medicines, updateMedicine, validateStock, deductBatchStock } = get();

        const validation = validateStock(items);
        if (!validation.valid) {
          return null;
        }

        const now = new Date().toISOString();

        const enrichedItems: SaleItem[] = items.map(item => {
          const deductions = deductBatchStock(item.medicineId, item.totalQuantity);
          if (deductions.length === 0) return null;
          return { ...item, batchDeductions: deductions };
        }).filter(Boolean) as SaleItem[];

        enrichedItems.forEach((item) => {
          const medicine = medicines.find((m) => m.id === item.medicineId);
          if (medicine) {
            updateMedicine(item.medicineId, {
              stock: medicine.stock - item.totalQuantity
            });
          }
        });

        const totalAmount = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);
        const totalProfit = enrichedItems.reduce((sum, item) => sum + item.profit, 0);

        const newSale: Sale = {
          id: 'sale-' + generateId(),
          saleTime: now,
          totalAmount,
          totalProfit,
          promotionId,
          remark,
          items: enrichedItems,
          status: 'completed'
        };

        set((state) => ({
          sales: [newSale, ...state.sales]
        }));

        return newSale;
      },

      refundSale: (saleId, remark = '') => {
        const { sales, batches, medicines, updateMedicine, updateBatch, addBatch } = get();
        const sale = sales.find(s => s.id === saleId);

        if (!sale || sale.status !== 'completed') return false;

        sale.items.forEach(item => {
          const medicine = medicines.find(m => m.id === item.medicineId);
          if (medicine) {
            updateMedicine(item.medicineId, {
              stock: medicine.stock + item.totalQuantity
            });
          }

          if (item.batchDeductions && item.batchDeductions.length > 0) {
            item.batchDeductions.forEach(deduction => {
              const batch = batches.find(b => b.id === deduction.batchId);
              if (batch) {
                updateBatch(deduction.batchId, {
                  quantity: batch.quantity + deduction.quantity
                });
              }
            });
          } else {
            const medicineBatches = batches
              .filter(b => b.medicineId === item.medicineId)
              .sort((a, b) => new Date(b.inboundDate).getTime() - new Date(a.inboundDate).getTime());

            let remaining = item.totalQuantity;

            for (const batch of medicineBatches) {
              if (remaining <= 0) break;
              const addBack = remaining;
              updateBatch(batch.id, {
                quantity: batch.quantity + addBack
              });
              remaining -= addBack;
            }

            if (remaining > 0 && medicine) {
              addBatch({
                medicineId: item.medicineId,
                batchNumber: `RET-${Date.now().toString(36).toUpperCase()}`,
                productionDate: medicine.productionDate,
                expiryDate: medicine.expiryDate,
                quantity: remaining,
                unitCost: medicine.costPrice,
                inboundDate: new Date().toISOString(),
                supplierId: medicine.supplierId
              });
            }
          }
        });

        set((state) => ({
          sales: state.sales.map(s =>
            s.id === saleId
              ? { ...s, status: 'refunded', refundTime: new Date().toISOString(), refundRemark: remark }
              : s
          )
        }));

        return true;
      },

      addInventory: (record) => {
        const { updateMedicine, medicines, addBatch } = get();
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

        addBatch({
          medicineId: record.medicineId,
          batchNumber: record.batchNumber,
          productionDate: record.productionDate,
          expiryDate: record.expiryDate,
          quantity: record.quantity,
          unitCost: record.unitCost,
          inboundDate: new Date().toISOString(),
          supplierId: medicine?.supplierId || ''
        });

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

      createPurchaseOrder: (items, supplierId, remark = '') => {
        const { suppliers } = get();
        const supplier = suppliers.find(s => s.id === supplierId);
        const now = new Date().toISOString();

        const poItems: PurchaseOrderItem[] = items.map(item => ({
          ...item,
          id: 'poi-' + generateId(),
          totalCost: item.quantity * item.unitCost
        }));

        const totalAmount = poItems.reduce((sum, item) => sum + item.totalCost, 0);

        const newOrder: PurchaseOrder = {
          id: 'po-' + generateId(),
          supplierId,
          supplierName: supplier?.name || '',
          items: poItems,
          totalAmount,
          status: 'pending',
          createdAt: now,
          remark
        };

        set((state) => ({
          purchaseOrders: [newOrder, ...state.purchaseOrders]
        }));

        return newOrder;
      },

      updatePurchaseOrderStatus: (id, status) => {
        const now = new Date().toISOString();
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map(po => {
            if (po.id !== id) return po;
            const updates: Partial<PurchaseOrder> = { status };
            if (status === 'ordered' && !po.orderedAt) {
              updates.orderedAt = now;
            }
            return { ...po, ...updates };
          })
        }));
      },

      receivePurchaseOrder: (id) => {
        const { purchaseOrders, batches, inventoryRecords, addBatch, updateMedicine, medicines, addInventory } = get();
        const order = purchaseOrders.find(po => po.id === id);
        if (!order || order.status === 'received' || order.receivedAt) return;
        if (order.status !== 'ordered') return;

        const existingBatches = batches.filter(b => b.purchaseOrderId === id);
        const existingRecords = inventoryRecords.filter(r => {
          const orderItem = order.items.find(i => i.medicineId === r.medicineId && i.batchNumber === r.batchNumber);
          return orderItem !== undefined;
        });
        if (existingBatches.length > 0 || existingRecords.length > 0) return;

        const now = new Date().toISOString();

        order.items.forEach(item => {
          const medicine = medicines.find(m => m.id === item.medicineId);
          if (medicine) {
            updateMedicine(item.medicineId, {
              stock: medicine.stock + item.quantity
            });
          }

          addBatch({
            medicineId: item.medicineId,
            batchNumber: item.batchNumber,
            productionDate: item.productionDate,
            expiryDate: item.expiryDate,
            quantity: item.quantity,
            unitCost: item.unitCost,
            inboundDate: now,
            supplierId: order.supplierId,
            purchaseOrderId: order.id
          });

          addInventory({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            quantity: item.quantity,
            unitCost: item.unitCost,
            productionDate: item.productionDate,
            expiryDate: item.expiryDate,
            batchNumber: item.batchNumber,
            inboundDate: now
          });
        });

        set((state) => ({
          purchaseOrders: state.purchaseOrders.map(po =>
            po.id === id ? { ...po, status: 'received', receivedAt: now } : po
          )
        }));
      },

      getExpiryAlerts: (days = 30) => {
        const { medicines, batches } = get();
        const alerts: ExpiryAlert[] = [];

        batches.forEach(batch => {
          if (batch.quantity <= 0) return;
          const daysRemaining = daysToExpiry(batch.expiryDate);
          if (daysRemaining <= days) {
            const medicine = medicines.find(m => m.id === batch.medicineId);
            if (medicine) {
              alerts.push({
                medicine,
                daysRemaining,
                level: getExpiryAlertLevel(daysRemaining),
                batch
              });
            }
          }
        });

        return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
      },

      getStockAlerts: () => {
        const { medicines, batches } = get();
        const alerts: StockAlert[] = [];

        medicines.forEach(medicine => {
          if (medicine.safetyStock <= 0) return;
          
          const medicineBatches = batches.filter(b => b.medicineId === medicine.id && b.quantity > 0);
          
          medicineBatches.forEach(batch => {
            const stockPercentage = (batch.quantity / medicine.safetyStock) * 100;
            if (stockPercentage <= 100) {
              alerts.push({
                medicine,
                stockPercentage,
                level: getStockAlertLevel(stockPercentage),
                batch
              });
            }
          });
          
          if (medicineBatches.length === 0) {
            alerts.push({
              medicine,
              stockPercentage: 0,
              level: 'critical'
            });
          }
        });

        return alerts.sort((a, b) => a.stockPercentage - b.stockPercentage);
      },

      getDailySales: (date) => {
        const { sales } = get();
        const validSales = sales.filter(s => s.status === 'completed');
        return calcDailySales(validSales, date || getTodayString());
      },

      getTopSellers: (period, limit = 10) => {
        const { sales, medicines } = get();
        const validSales = sales.filter(s => s.status === 'completed');
        return calcTopSellers(validSales, medicines, period, limit);
      },

      getPromotionEffect: (promotionId) => {
        const { sales, promotions } = get();
        const validSales = sales.filter(s => s.status === 'completed');
        const promotion = promotions.find((p) => p.id === promotionId);
        if (!promotion) {
          return { normalSales: 0, promotionSales: 0, increaseRate: 0 };
        }
        return calculatePromotionEffect(validSales, promotion);
      }
    }),
    {
      name: 'pharmacy-storage',
      version: 3,
      migrate: (persistedState: any) => {
        if (persistedState && !persistedState.batches) {
          persistedState.batches = [];
        }
        if (persistedState && !persistedState.purchaseOrders) {
          persistedState.purchaseOrders = [];
        }
        if (persistedState && persistedState.sales) {
          persistedState.sales = persistedState.sales.map((s: any) => {
            const items = (s.items || []).map((item: any) => ({
              ...item,
              batchDeductions: item.batchDeductions || []
            }));
            const totalAmount = items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
            const totalProfit = items.reduce((sum: number, item: any) => sum + (item.profit || 0), 0);
            return {
              ...s,
              status: s.status || 'completed',
              totalAmount,
              totalProfit,
              items
            };
          });
        }
        return persistedState;
      }
    }
  )
);
