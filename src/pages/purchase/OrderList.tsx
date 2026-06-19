import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Package,
  Check,
  Clock,
  XCircle,
  Eye,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PurchaseOrder, PurchaseOrderItem, PURCHASE_ORDER_STATUS_LABELS, PurchaseOrderStatus } from '../../types';
import { formatDateTime } from '../../utils/date';
import Modal from '../../components/Modal';
import { cn } from '../../lib/utils';

export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const { purchaseOrders, medicines, suppliers, updatePurchaseOrderStatus, receivePurchaseOrder } = useStore();
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
  const [confirmReceive, setConfirmReceive] = useState<string | null>(null);

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
          <h1 className="text-2xl font-bold text-slate-900">采购单管理</h1>
          <p className="text-slate-500 mt-1">管理采购订单，跟踪采购和入库进度</p>
        </div>
      </div>

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
    </div>
  );
}
