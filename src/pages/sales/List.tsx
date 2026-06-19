import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShoppingCart, Eye, Tag, Undo2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import DataTable, { Column } from '../../components/DataTable';
import SearchInput from '../../components/SearchInput';
import Modal from '../../components/Modal';
import { Sale } from '../../types';
import { formatDateTime } from '../../utils/date';
import { cn } from '../../lib/utils';

export default function SaleList() {
  const navigate = useNavigate();
  const { sales, medicines, promotions, refundSale } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [refundTarget, setRefundTarget] = useState<Sale | null>(null);
  const [refundRemark, setRefundRemark] = useState('');

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.items.some(item =>
      item.medicineName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesDate = !dateFilter || s.saleTime.startsWith(dateFilter);
    return matchesSearch && matchesDate;
  });

  const completedSales = filteredSales.filter(s => s.status === 'completed');

  const getPromotionName = (promotionId?: string) => {
    if (!promotionId) return '-';
    const promotion = promotions.find(p => p.id === promotionId);
    return promotion?.name || '-';
  };

  const handleRefund = () => {
    if (refundTarget) {
      refundSale(refundTarget.id, refundRemark);
      setRefundTarget(null);
      setRefundRemark('');
    }
  };

  const getSaleAmount = (sale: Sale) => sale.items.reduce((sum, item) => sum + item.subtotal, 0);
  const getSaleProfit = (sale: Sale) => sale.items.reduce((sum, item) => sum + item.profit, 0);

  const columns: Column<Sale>[] = [
    {
      key: 'saleTime',
      header: '销售时间',
      render: (value) => formatDateTime(value as string)
    },
    {
      key: 'status',
      header: '状态',
      render: (_, row) => row.status === 'completed' ? (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">已完成</span>
      ) : (
        <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-medium">已退款</span>
      )
    },
    {
      key: 'items',
      header: '药品明细',
      render: (_, row) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">
            {row.items.map(i => `${i.medicineName} ×${i.payQuantity}${i.freeQuantity > 0 ? `(赠${i.freeQuantity})` : ''}`).join(', ')}
          </p>
          <p className="text-xs text-slate-500">共 {row.items.length} 种药品，合计 {row.items.reduce((sum, i) => sum + i.totalQuantity, 0)} 件</p>
        </div>
      )
    },
    {
      key: 'totalAmount',
      header: '销售金额',
      render: (_, row) => <span className="font-semibold text-green-600">¥{getSaleAmount(row).toFixed(2)}</span>
    },
    {
      key: 'totalProfit',
      header: '利润',
      render: (_, row) => <span className="font-medium text-blue-600">¥{getSaleProfit(row).toFixed(2)}</span>
    },
    {
      key: 'promotionId',
      header: '促销活动',
      render: (value) => value ? (
        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
          <Tag className="w-3 h-3 inline mr-1" />
          {getPromotionName(value as string)}
        </span>
      ) : <span className="text-slate-400">-</span>
    },
    {
      key: 'actions',
      header: '操作',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewSale(row);
            }}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'completed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRefundTarget(row);
                setRefundRemark('');
              }}
              className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="退货"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">销售管理</h1>
          <p className="text-slate-500 mt-1">查看和管理销售记录</p>
        </div>
        <button
          onClick={() => navigate('/sales/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg shadow-green-500/30"
        >
          <Plus className="w-5 h-5" />
          新增销售
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索药品名称..."
          className="flex-1"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm"
          >
            清除筛选
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-sm text-slate-500">总销售额</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ¥{completedSales.reduce((sum, s) => sum + getSaleAmount(s), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-sm text-slate-500">总利润</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            ¥{completedSales.reduce((sum, s) => sum + getSaleProfit(s), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-sm text-slate-500">交易笔数</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {completedSales.length}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredSales}
        emptyMessage="暂无销售记录"
        rowClassName={(row) => row.status === 'refunded' ? 'opacity-50' : ''}
      />

      <Modal
        isOpen={!!viewSale}
        onClose={() => setViewSale(null)}
        title="销售详情"
        size="lg"
      >
        {viewSale && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">销售时间</p>
                <p className="font-medium">{formatDateTime(viewSale.saleTime)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">订单状态</p>
                <p className="font-medium">
                  {viewSale.status === 'completed' ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">已完成</span>
                  ) : (
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-medium">已退款</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">促销活动</p>
                <p className="font-medium">{getPromotionName(viewSale.promotionId)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">销售金额</p>
                <p className="font-semibold text-green-600 text-lg">¥{getSaleAmount(viewSale).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">利润</p>
                <p className="font-semibold text-blue-600 text-lg">¥{getSaleProfit(viewSale).toFixed(2)}</p>
              </div>
            </div>

            {viewSale.status === 'refunded' && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-slate-700">退货信息</p>
                {viewSale.refundTime && (
                  <p className="text-sm text-slate-600">退货时间：{formatDateTime(viewSale.refundTime)}</p>
                )}
                {viewSale.refundRemark && (
                  <p className="text-sm text-slate-600">退货备注：{viewSale.refundRemark}</p>
                )}
              </div>
            )}

            {viewSale.remark && (
              <div>
                <p className="text-sm text-slate-500">备注</p>
                <p className="font-medium">{viewSale.remark}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">商品明细</p>
              <div className="bg-slate-50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">药品名称</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">批号</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">数量</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">单价</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">小计</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">利润</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewSale.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 px-4">
                            <p className="font-medium">{item.medicineName}</p>
                            {item.freeQuantity > 0 && (
                              <p className="text-xs text-orange-600">含赠送 {item.freeQuantity} 件</p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-slate-600">
                            {item.batchDeductions.map(d => d.batchNumber).join(', ')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {item.payQuantity}
                            {item.freeQuantity > 0 && (
                              <span className="text-orange-600"> + {item.freeQuantity}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">¥{item.unitPrice.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            {item.discountAmount > 0 && (
                              <p className="text-xs text-green-600 line-through">¥{item.originalAmount.toFixed(2)}</p>
                            )}
                            <p className="font-medium">¥{item.subtotal.toFixed(2)}</p>
                          </td>
                          <td className="py-3 px-4 text-right text-green-600">¥{item.profit.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!refundTarget}
        onClose={() => {
          setRefundTarget(null);
          setRefundRemark('');
        }}
        title="确认退货"
      >
        {refundTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">确认退货此订单？退货后库存将恢复，销售额和利润将被回滚。</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">退货备注</label>
              <textarea
                value={refundRemark}
                onChange={(e) => setRefundRemark(e.target.value)}
                placeholder="请输入退货备注（可选）"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRefundTarget(null);
                  setRefundRemark('');
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={handleRefund}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                确认退货
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
