import { cn } from '../lib/utils';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: T[keyof T] | undefined, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
  rowClassName?: (row: T) => string;
}

export default function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = '暂无数据',
  className,
  rowClassName
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn(
        'bg-white rounded-xl border border-slate-200 p-12 text-center',
        className
      )}>
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-white rounded-xl border border-slate-200 overflow-hidden',
      className
    )}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    'px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-slate-50',
                  rowClassName?.(row)
                )}
              >
                {columns.map((col, colIdx) => {
                  const value = typeof col.key === 'string' ? (row as Record<string, unknown>)[col.key] : row[col.key];
                  return (
                    <td
                      key={colIdx}
                      className={cn(
                        'px-6 py-4 text-sm text-slate-700 whitespace-nowrap',
                        col.className
                      )}
                    >
                      {col.render ? col.render(value as T[keyof T] | undefined, row) : String(value ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
