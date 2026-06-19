import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { aggregateSalesByPeriod, calculateProfitRate } from '../utils/statistics';
import { CATEGORY_LABELS } from '../types';
import StatCard from '../components/StatCard';
import { cn } from '../lib/utils';

type Period = 'day' | 'week' | 'month';
type TabType = 'sales' | 'profit' | 'category' | 'promotion';

export default function Statistics() {
  const { sales, medicines, promotions, getTopSellers, getPromotionEffect } = useStore();
  const [period, setPeriod] = useState<Period>('week');
  const [activeTab, setActiveTab] = useState<TabType>('sales');

  const completedSales = sales.filter(s => s.status === 'completed');

  const salesData = aggregateSalesByPeriod(completedSales, period);
  const topSellers = getTopSellers('month', 10);
  const topProfit = [...topSellers].sort((a, b) => b.profit - a.profit);

  const categorySales = medicines.reduce((acc, med) => {
    const medSales = completedSales.reduce((sum, sale) => {
      return sum + sale.items
        .filter(item => item.medicineId === med.id)
        .reduce((itemSum, item) => itemSum + item.subtotal, 0);
    }, 0);
    if (medSales > 0) {
      acc[med.category] = (acc[med.category] || 0) + medSales;
    }
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categorySales).map(([category, value]) => ({
    name: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category,
    value
  }));

  const COLORS = ['#165DFF', '#00B42A', '#FF7D00', '#F53F3F', '#722ED1'];

  const totalSales = completedSales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.subtotal, 0), 0);
  const totalProfit = completedSales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.profit, 0), 0);
  const totalTransactions = completedSales.length;
  const avgOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  const tabs = [
    { key: 'sales', label: '销售趋势', icon: BarChart3 },
    { key: 'profit', label: '利润分析', icon: TrendingUp },
    { key: 'category', label: '分类占比', icon: PieChartIcon },
    { key: 'promotion', label: '促销效果', icon: ShoppingBag }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">统计分析</h1>
          <p className="text-slate-500 mt-1">全方位了解您的药店经营状况</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                period === p
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {p === 'day' ? '日' : p === 'week' ? '周' : '月'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总销售额"
          value={`¥${totalSales.toFixed(2)}`}
          subtitle={`${totalTransactions} 笔交易`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="总利润"
          value={`¥${totalProfit.toFixed(2)}`}
          subtitle={`利润率 ${totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0}%`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="交易次数"
          value={totalTransactions}
          subtitle="累计销售订单"
          icon={ShoppingBag}
          color="purple"
        />
        <StatCard
          title="客单价"
          value={`¥${avgOrderValue.toFixed(2)}`}
          subtitle="平均每单金额"
          icon={BarChart3}
          color="orange"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as TabType)}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                  activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">销售趋势</h3>
              {salesData.length === 0 ? (
                <p className="text-slate-500 text-center py-16">暂无销售数据</p>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number) => [`¥${value.toFixed(2)}`, '']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        name="销售额"
                        stroke="#165DFF"
                        strokeWidth={3}
                        dot={{ fill: '#165DFF', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        name="利润"
                        stroke="#00B42A"
                        strokeWidth={3}
                        dot={{ fill: '#00B42A', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profit' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">药品利润排行</h3>
              {topProfit.length === 0 ? (
                <p className="text-slate-500 text-center py-16">暂无销售数据</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProfit.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis
                          type="category"
                          dataKey="medicine.name"
                          stroke="#64748b"
                          fontSize={12}
                          width={100}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: number) => [`¥${value.toFixed(2)}`, '利润']}
                        />
                        <Bar dataKey="profit" name="利润" fill="#00B42A" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">排名</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">药品</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">利润</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">利润率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProfit.slice(0, 10).map((item, index) => {
                          const profitRate = calculateProfitRate(item.medicine.costPrice, item.medicine.salePrice);
                          return (
                            <tr key={item.medicine.id} className="border-b border-slate-50 hover:bg-slate-50">
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                  index === 1 ? 'bg-slate-100 text-slate-700' :
                                  index === 2 ? 'bg-orange-100 text-orange-700' :
                                  'bg-slate-50 text-slate-500'
                                }`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-medium text-slate-900">{item.medicine.name}</p>
                                <p className="text-xs text-slate-500">{item.medicine.specification}</p>
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-green-600">
                                ¥{item.profit.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={cn(
                                  'px-2 py-1 rounded text-xs font-medium',
                                  profitRate >= 50 ? 'bg-green-100 text-green-700' :
                                  profitRate >= 30 ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-700'
                                )}>
                                  {profitRate.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'category' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">分类销售占比</h3>
              {pieData.length === 0 ? (
                <p className="text-slate-500 text-center py-16">暂无销售数据</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: number) => [`¥${value.toFixed(2)}`, '销售额']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">分类</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">销售额</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">占比</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pieData.map((item, index) => {
                          const total = pieData.reduce((sum, d) => sum + d.value, 0);
                          const percent = total > 0 ? (item.value / total) * 100 : 0;
                          return (
                            <tr key={item.name} className="border-b border-slate-50 hover:bg-slate-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <span className="font-medium text-slate-900">{item.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-slate-900">
                                ¥{item.value.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                  {percent.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'promotion' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">促销效果分析</h3>
              {promotions.length === 0 ? (
                <p className="text-slate-500 text-center py-16">暂无促销活动</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {promotions.map((promo) => {
                    const effect = getPromotionEffect(promo.id);
                    return (
                      <div key={promo.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-slate-900">{promo.name}</h4>
                            <p className="text-sm text-slate-500">{promo.medicineName}</p>
                          </div>
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            promo.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          )}>
                            {promo.isActive ? '进行中' : '已结束'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">{effect.promotionSales}</p>
                            <p className="text-xs text-slate-500">活动销量</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{effect.normalSales}</p>
                            <p className="text-xs text-slate-500">预期销量</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {effect.increaseRate >= 0 ? (
                                <TrendingUp className="w-5 h-5 text-green-500" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-red-500" />
                              )}
                              <span className={`text-2xl font-bold ${effect.increaseRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {effect.increaseRate >= 0 ? '+' : ''}{effect.increaseRate.toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">增长率</p>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              effect.increaseRate >= 0 ? 'bg-green-500' : 'bg-red-500'
                            )}
                            style={{ width: `${Math.min(Math.max(effect.increaseRate + 50, 0), 200) / 2}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center">
                          {effect.increaseRate >= 0
                            ? `活动期间多卖出 ${effect.promotionSales - effect.normalSales} 件，表现优秀！`
                            : `活动期间销量低于预期 ${effect.normalSales - effect.promotionSales} 件`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">销量排行 TOP 10</h3>
          {topSellers.length === 0 ? (
            <p className="text-slate-500 text-center py-8">暂无销售数据</p>
          ) : (
            <div className="space-y-3">
              {topSellers.slice(0, 10).map((item, index) => (
                <div key={item.medicine.id} className="flex items-center gap-4">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-slate-100 text-slate-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.medicine.name}</p>
                    <p className="text-xs text-slate-500">{item.medicine.specification}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900">{item.quantity} {item.medicine.unit}</p>
                    <p className="text-xs text-slate-500">¥{item.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">利润排行 TOP 10</h3>
          {topProfit.length === 0 ? (
            <p className="text-slate-500 text-center py-8">暂无销售数据</p>
          ) : (
            <div className="space-y-3">
              {topProfit.slice(0, 10).map((item, index) => {
                const profitRate = calculateProfitRate(item.medicine.costPrice, item.medicine.salePrice);
                return (
                  <div key={item.medicine.id} className="flex items-center gap-4">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 ${
                      index === 0 ? 'bg-green-100 text-green-700' :
                      index === 1 ? 'bg-slate-100 text-slate-700' :
                      index === 2 ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{item.medicine.name}</p>
                      <p className="text-xs text-slate-500">利润率 {profitRate.toFixed(1)}%</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-green-600">¥{item.profit.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{item.quantity} {item.medicine.unit}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
