import { AlertLevel } from '../types';

export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.round((d2.getTime() - d1.getTime()) / oneDay);
}

export function daysToExpiry(expiryDate: string): number {
  return daysBetween(new Date(), new Date(expiryDate));
}

export function isValid(productionDate: string, expiryDate: string): boolean {
  const now = new Date();
  return new Date(productionDate) <= now && now <= new Date(expiryDate);
}

export function getExpiryAlertLevel(daysRemaining: number): AlertLevel {
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 30) return 'warning';
  return 'normal';
}

export function getStockAlertLevel(stockPercentage: number): AlertLevel {
  if (stockPercentage <= 20) return 'critical';
  if (stockPercentage <= 50) return 'warning';
  return 'normal';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  const d = new Date(date);
  const s = new Date(start);
  const e = new Date(end);
  return d >= s && d <= e;
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getStartOfPeriod(period: 'week' | 'month'): string {
  const now = new Date();
  if (period === 'week') {
    const day = now.getDay() || 7;
    now.setDate(now.getDate() - day + 1);
  } else {
    now.setDate(1);
  }
  return now.toISOString().split('T')[0];
}
