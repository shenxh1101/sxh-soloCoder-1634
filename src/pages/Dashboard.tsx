import { useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingBag, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import StatCard from '../components/StatCard';
import AlertCard from '../components/AlertCard';
import { formatDate, getTodayString } from '../utils/date';
import { CATEGORY_LABELS } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { getExpiryAlerts, getStockAlerts, getDailySales, getTopSellers, medicines } = useStore();
  
  const expiryAlerts = getExpiryAlerts(30);
  const stockAlerts = getStockAlerts();
  const todaySales = getDailySales(getTodayString());
  const topSellers = getTopSellers('week', 5);
  
  const criticalExpiry = expiryAlerts.filter(a => a.level === 'critical').length;
  const warningExpiry = expiryAlerts.filter(a => a.level === 'warning').length;
  const criticalStock = stockAlerts.filter(a => a.level === 'critical').length;
  const warningStock = stockAlerts.filter(a => a.level === 'warning').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">仪表板</h1>
        <p className="text-slate-500 mt-1">欢迎回来，这是您的药店今日概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="今日销售额"
          value={`¥${todaySales.amount.toFixed(2)}`}
          subtitle={`${todaySales.count} 笔交易`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="今日利润"
          value={`¥${todaySales.profit.toFixed(2)}`}
          subtitle="毛利收入"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="即将过期"
          value={expiryAlerts.length}
          subtitle={`${criticalExpiry} 个紧急，${warningExpiry} 个预警`}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="库存预警"
          value={stockAlerts.length}
          subtitle={`${criticalStock} 个紧缺，${warningStock} 个偏低`}
          icon={Package}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">过期提醒</h2>
            <button
              onClick={() => navigate('/medicines')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {expiryAlerts.length === 0 ? (
              <p className="text-slate-500 text-center py-8">暂无即将过期的药品</p>
            ) : (
              expiryAlerts.slice(0, 5).map((alert) => (
                <AlertCard
                  key={alert.medicine.id}
                  type="expiry"
                  title={alert.medicine.name}
                  subtitle={`${CATEGORY_LABELS[alert.medicine.category]} · ${alert.medicine.specification}`}
                  level={alert.level}
                  daysRemaining={alert.daysRemaining}
                  onClick={() => navigate('/medicines')}
                />
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">库存预警</h2>
            <button
              onClick={() => navigate('/inventory')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {stockAlerts.length === 0 ? (
              <p className="text-slate-500 text-center py-8">库存状态良好</p>
            ) : (
              stockAlerts.slice(0, 5).map((alert) => (
                <AlertCard
                  key={alert.medicine.id}
                  type="stock"
                  title={alert.medicine.name}
                  subtitle={`库存 ${alert.medicine.stock} ${alert.medicine.unit} / 安全库存 ${alert.medicine.safetyStock} ${alert.medicine.unit}`}
                  level={alert.level}
                  stockPercentage={alert.stockPercentage}
                  onClick={() => navigate('/inventory')}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">本周热销药品</h2>
          <button
            onClick={() => navigate('/statistics')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            查看完整报告
          </button>
        </div>
        {topSellers.length === 0 ? (
          <p className="text-slate-500 text-center py-8">本周暂无销售数据</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">排名</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">药品名称</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">分类</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">销量</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">销售额</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">利润</th>
                </tr>
              </thead>
              <tbody>
                {topSellers.map((item, index) => (
                  <tr key={item.medicine.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-slate-100 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{item.medicine.name}</p>
                        <p className="text-xs text-slate-500">{item.medicine.specification}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        {CATEGORY_LABELS[item.medicine.category]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {item.quantity} {item.medicine.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      ¥{item.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-green-600">
                      ¥{item.profit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
