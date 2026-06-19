import { Medicine, Supplier, Sale, Promotion, InventoryRecord, MedicineBatch, PurchaseOrder } from '../types';
import { addDays, getTodayString } from '../utils/date';

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: '安康医药有限公司',
    contact: '张经理',
    phone: '13800138001',
    address: '北京市朝阳区健康路88号',
    remark: '主要供应感冒药和消炎药',
    createdAt: '2024-01-15T09:00:00.000Z'
  },
  {
    id: 'sup-2',
    name: '康泰药业',
    contact: '李总',
    phone: '13900139002',
    address: '上海市浦东新区医药园区A栋',
    remark: '降压药和维生素厂家直供',
    createdAt: '2024-02-20T10:30:00.000Z'
  },
  {
    id: 'sup-3',
    name: '仁和堂医药批发',
    contact: '王经理',
    phone: '13700137003',
    address: '广州市天河区天河北路123号',
    remark: '品类齐全，价格优惠',
    createdAt: '2024-03-10T14:00:00.000Z'
  }
];

export const mockMedicines: Medicine[] = [
  {
    id: 'med-1',
    name: '999感冒灵颗粒',
    category: 'cold',
    specification: '10g*15袋',
    productionDate: addDays(getTodayString(), -60),
    expiryDate: addDays(getTodayString(), 25),
    costPrice: 8.5,
    salePrice: 15.0,
    supplierId: 'sup-1',
    stock: 45,
    safetyStock: 20,
    unit: '盒',
    createdAt: '2024-01-20T00:00:00.000Z',
    updatedAt: '2024-01-20T00:00:00.000Z'
  },
  {
    id: 'med-2',
    name: '复方氨酚烷胺片',
    category: 'cold',
    specification: '12片/盒',
    productionDate: addDays(getTodayString(), -180),
    expiryDate: addDays(getTodayString(), 10),
    costPrice: 5.0,
    salePrice: 9.9,
    supplierId: 'sup-1',
    stock: 8,
    safetyStock: 15,
    unit: '盒',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z'
  },
  {
    id: 'med-3',
    name: '硝苯地平缓释片',
    category: 'hypertension',
    specification: '10mg*30片',
    productionDate: addDays(getTodayString(), -90),
    expiryDate: addDays(getTodayString(), 270),
    costPrice: 12.0,
    salePrice: 22.0,
    supplierId: 'sup-2',
    stock: 60,
    safetyStock: 30,
    unit: '盒',
    createdAt: '2024-02-15T00:00:00.000Z',
    updatedAt: '2024-02-15T00:00:00.000Z'
  },
  {
    id: 'med-4',
    name: '缬沙坦胶囊',
    category: 'hypertension',
    specification: '80mg*28粒',
    productionDate: addDays(getTodayString(), -120),
    expiryDate: addDays(getTodayString(), 240),
    costPrice: 18.0,
    salePrice: 35.0,
    supplierId: 'sup-2',
    stock: 25,
    safetyStock: 20,
    unit: '盒',
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2024-03-01T00:00:00.000Z'
  },
  {
    id: 'med-5',
    name: '阿莫西林胶囊',
    category: 'anti-inflammatory',
    specification: '0.25g*24粒',
    productionDate: addDays(getTodayString(), -100),
    expiryDate: addDays(getTodayString(), 265),
    costPrice: 10.0,
    salePrice: 18.0,
    supplierId: 'sup-1',
    stock: 40,
    safetyStock: 25,
    unit: '盒',
    createdAt: '2024-03-10T00:00:00.000Z',
    updatedAt: '2024-03-10T00:00:00.000Z'
  },
  {
    id: 'med-6',
    name: '头孢克肟分散片',
    category: 'anti-inflammatory',
    specification: '0.1g*6片',
    productionDate: addDays(getTodayString(), -75),
    expiryDate: addDays(getTodayString(), 290),
    costPrice: 15.0,
    salePrice: 28.0,
    supplierId: 'sup-3',
    stock: 5,
    safetyStock: 15,
    unit: '盒',
    createdAt: '2024-03-20T00:00:00.000Z',
    updatedAt: '2024-03-20T00:00:00.000Z'
  },
  {
    id: 'med-7',
    name: '汤臣倍健维生素C片',
    category: 'vitamin',
    specification: '1g*100片',
    productionDate: addDays(getTodayString(), -200),
    expiryDate: addDays(getTodayString(), 165),
    costPrice: 45.0,
    salePrice: 79.0,
    supplierId: 'sup-2',
    stock: 30,
    safetyStock: 15,
    unit: '瓶',
    createdAt: '2024-04-01T00:00:00.000Z',
    updatedAt: '2024-04-01T00:00:00.000Z'
  },
  {
    id: 'med-8',
    name: '善存多维元素片',
    category: 'vitamin',
    specification: '60片/瓶',
    productionDate: addDays(getTodayString(), -150),
    expiryDate: addDays(getTodayString(), 215),
    costPrice: 55.0,
    salePrice: 98.0,
    supplierId: 'sup-3',
    stock: 18,
    safetyStock: 10,
    unit: '瓶',
    createdAt: '2024-04-10T00:00:00.000Z',
    updatedAt: '2024-04-10T00:00:00.000Z'
  },
  {
    id: 'med-9',
    name: '布洛芬缓释胶囊',
    category: 'other',
    specification: '0.3g*20粒',
    productionDate: addDays(getTodayString(), -5),
    expiryDate: addDays(getTodayString(), 360),
    costPrice: 7.5,
    salePrice: 14.0,
    supplierId: 'sup-1',
    stock: 50,
    safetyStock: 20,
    unit: '盒',
    createdAt: '2024-04-15T00:00:00.000Z',
    updatedAt: '2024-04-15T00:00:00.000Z'
  },
  {
    id: 'med-10',
    name: '藿香正气水',
    category: 'other',
    specification: '10ml*10支',
    productionDate: addDays(getTodayString(), -30),
    expiryDate: addDays(getTodayString(), 335),
    costPrice: 6.0,
    salePrice: 12.0,
    supplierId: 'sup-3',
    stock: 35,
    safetyStock: 25,
    unit: '盒',
    createdAt: '2024-04-20T00:00:00.000Z',
    updatedAt: '2024-04-20T00:00:00.000Z'
  }
];

export const mockInventoryRecords: InventoryRecord[] = [
  {
    id: 'inv-1',
    medicineId: 'med-1',
    medicineName: '999感冒灵颗粒',
    quantity: 50,
    unitCost: 8.5,
    productionDate: addDays(getTodayString(), -60),
    expiryDate: addDays(getTodayString(), 25),
    batchNumber: 'B20240401',
    inboundDate: addDays(getTodayString(), -58)
  },
  {
    id: 'inv-2',
    medicineId: 'med-3',
    medicineName: '硝苯地平缓释片',
    quantity: 60,
    unitCost: 12.0,
    productionDate: addDays(getTodayString(), -90),
    expiryDate: addDays(getTodayString(), 270),
    batchNumber: 'B20240301',
    inboundDate: addDays(getTodayString(), -88)
  },
  {
    id: 'inv-3',
    medicineId: 'med-5',
    medicineName: '阿莫西林胶囊',
    quantity: 40,
    unitCost: 10.0,
    productionDate: addDays(getTodayString(), -100),
    expiryDate: addDays(getTodayString(), 265),
    batchNumber: 'B20240228',
    inboundDate: addDays(getTodayString(), -98)
  }
];

export const mockBatches: MedicineBatch[] = [
  {
    id: 'batch-1',
    medicineId: 'med-1',
    batchNumber: 'B20240401',
    productionDate: addDays(getTodayString(), -60),
    expiryDate: addDays(getTodayString(), 25),
    quantity: 34,
    unitCost: 8.5,
    inboundDate: addDays(getTodayString(), -58),
    supplierId: 'sup-1'
  },
  {
    id: 'batch-1b',
    medicineId: 'med-1',
    batchNumber: 'B20240515',
    productionDate: addDays(getTodayString(), -30),
    expiryDate: addDays(getTodayString(), 335),
    quantity: 11,
    unitCost: 8.5,
    inboundDate: addDays(getTodayString(), -28),
    supplierId: 'sup-1'
  },
  {
    id: 'batch-2',
    medicineId: 'med-2',
    batchNumber: 'B20231201',
    productionDate: addDays(getTodayString(), -180),
    expiryDate: addDays(getTodayString(), 10),
    quantity: 8,
    unitCost: 5.0,
    inboundDate: addDays(getTodayString(), -178),
    supplierId: 'sup-1'
  },
  {
    id: 'batch-3',
    medicineId: 'med-3',
    batchNumber: 'B20240301',
    productionDate: addDays(getTodayString(), -90),
    expiryDate: addDays(getTodayString(), 270),
    quantity: 59,
    unitCost: 12.0,
    inboundDate: addDays(getTodayString(), -88),
    supplierId: 'sup-2'
  },
  {
    id: 'batch-4',
    medicineId: 'med-4',
    batchNumber: 'B20240215',
    productionDate: addDays(getTodayString(), -120),
    expiryDate: addDays(getTodayString(), 240),
    quantity: 25,
    unitCost: 18.0,
    inboundDate: addDays(getTodayString(), -118),
    supplierId: 'sup-2'
  },
  {
    id: 'batch-5',
    medicineId: 'med-5',
    batchNumber: 'B20240228',
    productionDate: addDays(getTodayString(), -100),
    expiryDate: addDays(getTodayString(), 265),
    quantity: 38,
    unitCost: 10.0,
    inboundDate: addDays(getTodayString(), -98),
    supplierId: 'sup-1'
  },
  {
    id: 'batch-6',
    medicineId: 'med-6',
    batchNumber: 'B20240310',
    productionDate: addDays(getTodayString(), -75),
    expiryDate: addDays(getTodayString(), 290),
    quantity: 5,
    unitCost: 15.0,
    inboundDate: addDays(getTodayString(), -73),
    supplierId: 'sup-3'
  },
  {
    id: 'batch-7',
    medicineId: 'med-7',
    batchNumber: 'B20240101',
    productionDate: addDays(getTodayString(), -200),
    expiryDate: addDays(getTodayString(), 165),
    quantity: 30,
    unitCost: 45.0,
    inboundDate: addDays(getTodayString(), -198),
    supplierId: 'sup-2'
  },
  {
    id: 'batch-8',
    medicineId: 'med-8',
    batchNumber: 'B20240120',
    productionDate: addDays(getTodayString(), -150),
    expiryDate: addDays(getTodayString(), 215),
    quantity: 17,
    unitCost: 55.0,
    inboundDate: addDays(getTodayString(), -148),
    supplierId: 'sup-3'
  },
  {
    id: 'batch-9',
    medicineId: 'med-9',
    batchNumber: 'B20240610',
    productionDate: addDays(getTodayString(), -5),
    expiryDate: addDays(getTodayString(), 360),
    quantity: 50,
    unitCost: 7.5,
    inboundDate: addDays(getTodayString(), -3),
    supplierId: 'sup-1'
  },
  {
    id: 'batch-10',
    medicineId: 'med-10',
    batchNumber: 'B20240520',
    productionDate: addDays(getTodayString(), -30),
    expiryDate: addDays(getTodayString(), 335),
    quantity: 35,
    unitCost: 6.0,
    inboundDate: addDays(getTodayString(), -28),
    supplierId: 'sup-3'
  }
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-1',
    supplierId: 'sup-1',
    supplierName: '安康医药有限公司',
    items: [
      {
        id: 'poi-1',
        medicineId: 'med-1',
        medicineName: '999感冒灵颗粒',
        specification: '10g*15袋',
        quantity: 30,
        unitCost: 8.5,
        totalCost: 255,
        batchNumber: 'B20240515',
        productionDate: addDays(getTodayString(), -30),
        expiryDate: addDays(getTodayString(), 335)
      }
    ],
    totalAmount: 255,
    status: 'received',
    createdAt: addDays(getTodayString(), -28) + 'T09:00:00.000Z',
    orderedAt: addDays(getTodayString(), -27) + 'T10:00:00.000Z',
    receivedAt: addDays(getTodayString(), -25) + 'T14:00:00.000Z',
    remark: '常规补货'
  }
];

export const mockPromotions: Promotion[] = [
  {
    id: 'promo-1',
    name: '感冒灵买三送一',
    medicineId: 'med-1',
    medicineName: '999感冒灵颗粒',
    type: 'buy_n_get_m',
    buyQuantity: 3,
    freeQuantity: 1,
    discountRate: 100,
    startDate: addDays(getTodayString(), -3),
    endDate: addDays(getTodayString(), 12),
    isActive: true
  },
  {
    id: 'promo-2',
    name: '维生素C特惠',
    medicineId: 'med-7',
    medicineName: '汤臣倍健维生素C片',
    type: 'discount',
    buyQuantity: 1,
    freeQuantity: 0,
    discountRate: 85,
    startDate: addDays(getTodayString(), -1),
    endDate: addDays(getTodayString(), 14),
    isActive: true
  }
];

export const mockSales: Sale[] = [
  {
    id: 'sale-1',
    saleTime: addDays(getTodayString(), -7) + 'T10:30:00.000Z',
    totalAmount: 45.0,
    totalProfit: 19.5,
    remark: '',
    status: 'completed',
    items: [
      {
        id: 'item-1',
        medicineId: 'med-1',
        medicineName: '999感冒灵颗粒',
        payQuantity: 3,
        freeQuantity: 0,
        totalQuantity: 3,
        unitPrice: 15.0,
        originalAmount: 45.0,
        discountAmount: 0,
        subtotal: 45.0,
        costAmount: 25.5,
        profit: 19.5,
        batchDeductions: [{ batchId: 'batch-1', batchNumber: 'B20240401', quantity: 3, unitCost: 8.5 }]
      }
    ]
  },
  {
    id: 'sale-2',
    saleTime: addDays(getTodayString(), -5) + 'T14:20:00.000Z',
    totalAmount: 112.15,
    totalProfit: 33.15,
    promotionId: 'promo-1',
    remark: '促销活动',
    status: 'completed',
    items: [
      {
        id: 'item-2',
        medicineId: 'med-1',
        medicineName: '999感冒灵颗粒',
        payQuantity: 3,
        freeQuantity: 1,
        totalQuantity: 4,
        unitPrice: 15.0,
        originalAmount: 60.0,
        discountAmount: 15.0,
        subtotal: 45.0,
        costAmount: 34.0,
        profit: 11.0,
        batchDeductions: [{ batchId: 'batch-1', batchNumber: 'B20240401', quantity: 4, unitCost: 8.5 }]
      },
      {
        id: 'item-3',
        medicineId: 'med-7',
        medicineName: '汤臣倍健维生素C片',
        payQuantity: 1,
        freeQuantity: 0,
        totalQuantity: 1,
        unitPrice: 79.0,
        originalAmount: 79.0,
        discountAmount: 11.85,
        subtotal: 67.15,
        costAmount: 45.0,
        profit: 22.15,
        batchDeductions: [{ batchId: 'batch-7', batchNumber: 'B20240101', quantity: 1, unitCost: 45.0 }]
      }
    ]
  },
  {
    id: 'sale-3',
    saleTime: addDays(getTodayString(), -3) + 'T09:15:00.000Z',
    totalAmount: 22.0,
    totalProfit: 10.0,
    remark: '',
    status: 'completed',
    items: [
      {
        id: 'item-4',
        medicineId: 'med-3',
        medicineName: '硝苯地平缓释片',
        payQuantity: 1,
        freeQuantity: 0,
        totalQuantity: 1,
        unitPrice: 22.0,
        originalAmount: 22.0,
        discountAmount: 0,
        subtotal: 22.0,
        costAmount: 12.0,
        profit: 10.0,
        batchDeductions: [{ batchId: 'batch-3', batchNumber: 'B20240301', quantity: 1, unitCost: 12.0 }]
      }
    ]
  },
  {
    id: 'sale-4',
    saleTime: addDays(getTodayString(), -2) + 'T16:45:00.000Z',
    totalAmount: 90.0,
    totalProfit: 22.0,
    promotionId: 'promo-1',
    remark: '',
    status: 'completed',
    items: [
      {
        id: 'item-5',
        medicineId: 'med-1',
        medicineName: '999感冒灵颗粒',
        payQuantity: 6,
        freeQuantity: 2,
        totalQuantity: 8,
        unitPrice: 15.0,
        originalAmount: 120.0,
        discountAmount: 30.0,
        subtotal: 90.0,
        costAmount: 68.0,
        profit: 22.0,
        batchDeductions: [{ batchId: 'batch-1', batchNumber: 'B20240401', quantity: 8, unitCost: 8.5 }]
      }
    ]
  },
  {
    id: 'sale-5',
    saleTime: addDays(getTodayString(), -1) + 'T11:00:00.000Z',
    totalAmount: 50.0,
    totalProfit: 22.5,
    remark: '',
    status: 'completed',
    items: [
      {
        id: 'item-6',
        medicineId: 'med-5',
        medicineName: '阿莫西林胶囊',
        payQuantity: 2,
        freeQuantity: 0,
        totalQuantity: 2,
        unitPrice: 18.0,
        originalAmount: 36.0,
        discountAmount: 0,
        subtotal: 36.0,
        costAmount: 20.0,
        profit: 16.0,
        batchDeductions: [{ batchId: 'batch-5', batchNumber: 'B20240228', quantity: 2, unitCost: 10.0 }]
      },
      {
        id: 'item-7',
        medicineId: 'med-9',
        medicineName: '布洛芬缓释胶囊',
        payQuantity: 1,
        freeQuantity: 0,
        totalQuantity: 1,
        unitPrice: 14.0,
        originalAmount: 14.0,
        discountAmount: 0,
        subtotal: 14.0,
        costAmount: 7.5,
        profit: 6.5,
        batchDeductions: [{ batchId: 'batch-9', batchNumber: 'B20240610', quantity: 1, unitCost: 7.5 }]
      }
    ]
  },
  {
    id: 'sale-6',
    saleTime: getTodayString() + 'T09:30:00.000Z',
    totalAmount: 98.0,
    totalProfit: 43.0,
    remark: '',
    status: 'completed',
    items: [
      {
        id: 'item-8',
        medicineId: 'med-8',
        medicineName: '善存多维元素片',
        payQuantity: 1,
        freeQuantity: 0,
        totalQuantity: 1,
        unitPrice: 98.0,
        originalAmount: 98.0,
        discountAmount: 0,
        subtotal: 98.0,
        costAmount: 55.0,
        profit: 43.0,
        batchDeductions: [{ batchId: 'batch-8', batchNumber: 'B20240120', quantity: 1, unitCost: 55.0 }]
      }
    ]
  }
];
