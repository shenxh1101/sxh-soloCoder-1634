import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Pill,
  Package,
  ShoppingCart,
  Tag,
  Users,
  BarChart3,
  Truck
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表板' },
  { to: '/medicines', icon: Pill, label: '药品管理' },
  { to: '/inventory', icon: Package, label: '库存管理' },
  { to: '/sales', icon: ShoppingCart, label: '销售管理' },
  { to: '/promotions', icon: Tag, label: '促销活动' },
  { to: '/suppliers', icon: Users, label: '供应商' },
  { to: '/restock', icon: Truck, label: '进货建议' },
  { to: '/statistics', icon: BarChart3, label: '统计分析' }
];

export default function Navbar() {
  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 min-h-screen text-white flex flex-col shadow-xl">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">药店管理系统</h1>
            <p className="text-xs text-slate-400">Pharmacy Manager</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-xs text-slate-400">今日日期</p>
          <p className="text-lg font-semibold">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>
      </div>
    </aside>
  );
}
