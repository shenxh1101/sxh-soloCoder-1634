import { AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { AlertLevel } from '../types';
import { cn } from '../lib/utils';

interface AlertCardProps {
  type: 'expiry' | 'stock';
  title: string;
  subtitle: string;
  level: AlertLevel;
  daysRemaining?: number;
  stockPercentage?: number;
  onClick?: () => void;
}

const levelStyles: Record<AlertLevel, { bg: string; border: string; text: string; pulse: boolean }> = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-600',
    pulse: true
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-600',
    pulse: false
  },
  normal: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-600',
    pulse: false
  }
};

export default function AlertCard({
  type,
  title,
  subtitle,
  level,
  daysRemaining,
  stockPercentage,
  onClick
}: AlertCardProps) {
  const styles = levelStyles[level];
  const Icon = type === 'expiry' ? Clock : TrendingDown;

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md',
        styles.bg,
        styles.border,
        styles.pulse && 'animate-pulse'
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          type === 'expiry' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900 truncate">{title}</h4>
            {level === 'critical' && (
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
          {type === 'expiry' && daysRemaining !== undefined && (
            <div className="mt-2">
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold',
                level === 'critical' ? 'bg-red-600 text-white' :
                level === 'warning' ? 'bg-orange-500 text-white' :
                'bg-slate-500 text-white'
              )}>
                {daysRemaining > 0 ? `还剩 ${daysRemaining} 天` : `已过期 ${Math.abs(daysRemaining)} 天`}
              </span>
            </div>
          )}
          {type === 'stock' && stockPercentage !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>库存比例</span>
                <span>{Math.round(stockPercentage)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    level === 'critical' ? 'bg-red-500' :
                    level === 'warning' ? 'bg-orange-500' : 'bg-green-500'
                  )}
                  style={{ width: `${Math.min(100, stockPercentage)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
