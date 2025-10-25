import { CARD_COMMISSION_RATE, IVA_RATE } from './constants';
import { Service } from '../types/database';

export function calculateCardCommission(amount: number): number {
  const commission = amount * CARD_COMMISSION_RATE;
  const commissionWithIVA = commission * (1 + IVA_RATE);
  return Math.round(commissionWithIVA * 100) / 100;
}

export function calculateNetAmount(gross: number, paymentMethod: string): number {
  if (paymentMethod === 'card') {
    return gross - calculateCardCommission(gross);
  }
  return gross;
}

export function calculateAppointmentTotal(services: Service[]): number {
  return services.reduce((total, service) => total + Number(service.price), 0);
}

export function calculateBalancePending(total: number, deposit: number): number {
  return total - deposit;
}

export function calculateProfit(price: number, cost: number): number {
  return price - cost;
}

export function calculatePercentageCommission(amount: number, percentage: number): number {
  return Math.round((amount * percentage / 100) * 100) / 100;
}

export function calculateServiceCommission(
  servicePrice: number,
  commissionType: 'percentage' | 'fixed',
  commissionValue: number
): number {
  if (commissionType === 'percentage') {
    return calculatePercentageCommission(servicePrice, commissionValue);
  }
  return commissionValue;
}

export function calculateCashRegisterExpected(
  openingAmount: number,
  cashIncome: number,
  cashExpenses: number
): number {
  return openingAmount + cashIncome - cashExpenses;
}

export function calculateCashRegisterDifference(
  expectedAmount: number,
  closingAmount: number
): number {
  return closingAmount - expectedAmount;
}

export function calculateProfitMargin(profit: number, revenue: number): number {
  if (revenue === 0) return 0;
  return Math.round((profit / revenue) * 10000) / 100;
}

export function calculateTotalWithCommissions(
  gross: number,
  paymentMethod: string
): { gross: number; commission: number; net: number } {
  const commission = paymentMethod === 'card' ? calculateCardCommission(gross) : 0;
  const net = gross - commission;

  return {
    gross,
    commission,
    net
  };
}

export function validatePaymentTotal(
  pendingAmount: number,
  payments: { amount: number }[]
): boolean {
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return Math.abs(total - pendingAmount) < 0.01;
}

export function sumArray(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 10000) / 100;
}
