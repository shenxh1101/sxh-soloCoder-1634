import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Package,
  Check,
  Clock,
  XCircle,
  Eye,
  ArrowRight,
  Users,
  ShoppingCart,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PurchaseOrder, PurchaseOrderItem, PURCHASE_ORDER_STATUS_LABELS, PurchaseOrderStatus, SupplierPurchaseSummary } from '../../types';
import { formatDate, formatDateTime } from '../../utils/date';
import Modal from '../../components/Modal';
import { cn } from '../../lib/utils';

export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const { purchaseOrders, medicines, suppliers, updatePurchaseOrderStatus, receivePurchaseOrder, getSupplierPurchaseSummary } = useStore();
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
  const [confirmReceive, setConfirmReceive] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [viewSupplier, setViewSupplier] = useState<SupplierPurchaseSummary | null>(null);

  const supplierSummaries = useMemo(() => getSupplierPurchaseSummary(), [purchaseOrders, suppliers]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return purchaseOrders;
    return purchaseOrders.filter(po => po.status === statusFilter);
  }, [purchaseOrders, statusFilter]);

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'ordered':
        return 'bg-blue-100 text-blue-700';
      case 'received':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-slate-100 text-slate-500';
    }
  };

  const getStatusIcon = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3.5 h-3.5" />;
      case 'ordered':
        return <Truck className="w-3.5 h-3.5" />;
      case 'received':
        return <Check className="w-3.5 h-3.5" />;
      case 'cancelled':
        return <XCircle className="w-3.5 h-3.5" />;
    }
  };

  const pendingCount = purchaseOrders.filter(po => po.status === 'pending').length;
  const orderedCount = purchaseOrders.filter(po => po.status === 'ordered').length;
  const totalAmount = filteredOrders.reduce((sum, po) => sum + po.totalAmount, 0);

  const handleConfirmOrder = (id: string) => {
    updatePurchaseOrderStatus(id, 'ordered');
    setViewOrder(null);
  };

  const handleConfirmReceive = (id: string) => {
    receivePurchaseOrder(id);
    setConfirmReceive(null);
    setViewOrder(null);
  };

  const handleCancel = (id: string) => {
    updatePurchaseOrderStatus(id, 'cancelled');
    setViewOrder(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">采购管理</h1>
          <p className="text-slate-500 mt-1">管理采购订单和供应商汇总</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              'px-6 py-3 text-sm font-medium transition-colors',
              activeTab === 'orders'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            采购单列表
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={cn(
              'px-6 py-3 text-sm font-medium transition-colors',
              activeTab === 'suppliers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            供应商汇总
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">待下单</p>
                      <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Truck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">已下单</p>
                      <p className="text-2xl font-bold text-blue-600">{orderedCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">已入库</p>
                      <p className="text-2xl font-bold text-green-600">
                        {purchaseOrders.filter(po => po.status === 'received').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">采购总金额</p>
                      <p className="text-2xl font-bold text-slate-900">¥{totalAmount.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {(['all', 'pending', 'ordered', 'received', 'cancelled'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    {status === 'all' ? '全部' : PURCHASE_ORDER_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">采购单号</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">供应商</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">药品数</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">采购金额</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">状态</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">创建时间</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-slate-400">
                            <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>暂无采购单</p>
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(order => (
                          <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4">
                              <span className="font-mono text-sm font-medium">{order.id}</span>
                            </td>
                            <td className="px-4 py-4 font-medium">{order.supplierName}</td>
                            <td className="px-4 py-4">{order.items.length} 种</td>
                            <td className="px-4 py-4 text-right font-semibold">¥{order.totalAmount.toFixed(2)}</td>
                            <td className="px-4 py-4 text-center">
                              <span className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                                getStatusBadge(order.status)
                              )}>
                                {getStatusIcon(order.status)}
                                {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">{formatDateTime(order.createdAt)}</td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setViewOrder(order)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {order.status === 'pending' && (
                                  <button
                                    onClick={() => handleConfirmOrder(order.id)}
                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="确认下单"
                                  >
                                    <Truck className="w-4 h-4" />
                                  </button>
                                )}
                                {order.status === 'ordered' && (
                                  <button
                                    onClick={() => setConfirmReceive(order.id)}
                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="确认入库"
                                  >
                                    <Package className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              {supplierSummaries.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无供应商采购记录</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supplierSummaries.map(summary => (
                    <div
                      key={summary.supplierId}
                      className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setViewSupplier(summary)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{summary.supplierName}</h3>
                            <p className="text-sm text-slate-500">{summary.supplierId}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500">采购次数</p>
                          <p className="text-lg font-bold text-slate-900">{summary.purchaseCount}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500">采购金额</p>
                          <p className="text-lg font-bold text-green-600">¥{summary.totalAmount.toFixed(0)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500">最近到货</p>
                          <p className="text-sm font-bold text-slate-700">
                            {summary.lastReceiveDate ? formatDate(summary.lastReceiveDate) : '-'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 mb-2">常买药品</p>
                        <div className="flex flex-wrap gap-1">
                          {summary.topMedicines.slice(0, 3).map(med => (
                            <span
                              key={med.medicineId}
                              className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                            >
                              {med.medicineName}
                            </span>
                          ))}
                          {summary.topMedicines.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                              +{summary.topMedicines.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        title="采购单详情"
        size="lg"
      >
        {viewOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">采购单号</p>
                <p className="font-mono font-medium">{viewOrder.id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">供应商</p>
                <p className="font-medium">{viewOrder.supplierName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">状态</p>
                <span className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                  getStatusBadge(viewOrder.status)
                )}>
                  {getStatusIcon(viewOrder.status)}
                  {PURCHASE_ORDER_STATUS_LABELS[viewOrder.status]}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500">采购金额</p>
                <p className="font-semibold text-green-600 text-lg">¥{viewOrder.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">创建时间</p>
                <p className="font-medium">{formatDateTime(viewOrder.createdAt)}</p>
              </div>
              {viewOrder.orderedAt && (
                <div>
                  <p className="text-sm text-slate-500">下单时间</p>
                  <p className="font-medium">{formatDateTime(viewOrder.orderedAt)}</p>
                </div>
              )}
              {viewOrder.receivedAt && (
                <div>
                  <p className="text-sm text-slate-500">入库时间</p>
                  <p className="font-medium">{formatDateTime(viewOrder.receivedAt)}</p>
                </div>
              )}
            </div>

            {viewOrder.remark && (
              <div>
                <p className="text-sm text-slate-500">备注</p>
                <p className="font-medium">{viewOrder.remark}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">采购明细</p>
              <div className="bg-slate-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">药品名称</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">规格</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">数量</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">单价</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">小计</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">批号</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">有效期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 px-4 font-medium">{item.medicineName}</td>
                        <td className="py-3 px-4 text-sm text-slate-500">{item.specification}</td>
                        <td className="py-3 px-4 text-right">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">¥{item.unitCost.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-medium">¥{item.totalCost.toFixed(2)}</td>
                        <td className="py-3 px-4 font-mono text-sm">{item.batchNumber}</td>
                        <td className="py-3 px-4 text-sm">{item.expiryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              {viewOrder.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleCancel(viewOrder.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    取消采购
                  </button>
                  <button
                    onClick={() => handleConfirmOrder(viewOrder.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    确认下单
                  </button>
                </>
              )}
              {viewOrder.status === 'ordered' && (
                <button
                  onClick={() => {
                    setViewOrder(null);
                    setConfirmReceive(viewOrder.id);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  确认入库
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!confirmReceive}
        onClose={() => setConfirmReceive(null)}
        title="确认入库"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            确认此采购单已到货并入库？入库后药品库存将自动增加，批次信息将自动创建。
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmReceive(null)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => confirmReceive && handleConfirmReceive(confirmReceive)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              确认入库
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!viewSupplier}
        onClose={() => setViewSupplier(null)}
        title="供应商采购详情"
        size="lg"
      >
        {viewSupplier && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{viewSupplier.supplierName}</h2>
                <p className="text-slate-500">{viewSupplier.supplierId}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="text-sm">采购次数</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{viewSupplier.purchaseCount}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">累计采购金额</span>
                </div>
                <p className="text-2xl font-bold text-green-600">¥{viewSupplier.totalAmount.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">最近到货时间</span>
                </div>
                <p className="text-lg font-bold text-slate-700">
                  {viewSupplier.lastReceiveDate ? formatDate(viewSupplier.lastReceiveDate) : '-'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">常买药品</h3>
              <div className="bg-slate-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">药品名称</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">采购数量</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">采购金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewSupplier.topMedicines.map(med => (
                      <tr key={med.medicineId} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 px-4 font-medium">{med.medicineName}</td>
                        <td className="py-3 px-4 text-right">{med.totalQuantity}</td>
                        <td className="py-3 px-4 text-right font-medium">¥{med.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">最近采购单</h3>
              <div className="space-y-2">
                {purchaseOrders
                  .filter(po => po.supplierId === viewSupplier.supplierId && po.status === 'received')
                  .sort((a, b) => new Date(b.receivedAt || b.createdAt).getTime() - new Date(a.receivedAt || a.createdAt).getTime())
                  .slice(0, 5)
                  .map(order => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setViewSupplier(null);
                        setViewOrder(order);
                      }}
                    >
                      <div>
                        <p className="font-mono text-sm font-medium">{order.id}</p>
                        <p className="text-xs text-slate-500">{order.items.length} 种药品 · {formatDate(order.receivedAt || order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">¥{order.totalAmount.toFixed(2)}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setViewSupplier(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
