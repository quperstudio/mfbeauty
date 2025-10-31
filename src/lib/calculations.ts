import { CARD_COMMISSION_RATE, IVA_RATE } from './constants';
import { Service } from '../types/database';

// FUNCIONES DE COMISIÓN Y TARJETA
// ------------------------------

/** Calcula la comisión por tarjeta, incluyendo el IVA */
export function calculateCardCommission(amount: number): number {
  const commissionBase = amount * CARD_COMMISSION_RATE;
  const commissionWithIVA = commissionBase * (1 + IVA_RATE);
  // Redondea a dos decimales
  return Math.round(commissionWithIVA * 100) / 100;
}

/** Calcula el monto neto después de aplicar la comisión si el pago es con tarjeta */
export function calculateNetAmount(gross: number, paymentMethod: 'cash' | 'card' | string): number {
  if (paymentMethod === 'card') {
    return gross - calculateCardCommission(gross);
  }
  return gross;
}

/**
 * Calcula el total (bruto, comisión y neto) de una transacción
 */
export function calculateTotalWithCommissions(
  gross: number,
  paymentMethod: 'cash' | 'card' | string
): { gross: number; commission: number; net: number } {
  const commission = paymentMethod === 'card' ? calculateCardCommission(gross) : 0;
  const net = gross - commission;

  return {
    gross,
    commission,
    net
  };
}

// FUNCIONES DE CÁLCULO DE SERVICIOS Y GANANCIAS
// ----------------------------------------------

/** Calcula la suma de los precios de una lista de servicios */
export function calculateAppointmentTotal(services: Service[]): number {
  return services.reduce((total, service) => total + Number(service.price), 0);
}

/** Calcula la diferencia entre el total y un depósito */
export function calculateBalancePending(total: number, deposit: number): number {
  return total - deposit;
}

/** Calcula la ganancia (precio - costo) */
export function calculateProfit(price: number, cost: number): number {
  return price - cost;
}

/** Calcula la comisión por porcentaje */
export function calculatePercentageCommission(amount: number, percentage: number): number {
  return Math.round((amount * percentage / 100) * 100) / 100;
}

/** Calcula la comisión de un servicio basado en el tipo (porcentaje o fijo) */
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

/**
 * Calcula el margen de ganancia en porcentaje.
 * @returns Margen de ganancia redondeado a dos decimales (ej. 25.50)
 */
export function calculateProfitMargin(profit: number, revenue: number): number {
  if (revenue === 0) return 0;
  // Multiplica por 10000 para obtener dos decimales de precisión
  return Math.round((profit / revenue) * 10000) / 100;
}

// FUNCIONES DE CAJA REGISTRADORA
// ------------------------------

/** Calcula el monto esperado en caja (Efectivo inicial + Ingresos - Gastos) */
export function calculateCashRegisterExpected(
  openingAmount: number,
  cashIncome: number,
  cashExpenses: number
): number {
  return openingAmount + cashIncome - cashExpenses;
}

/** Calcula la diferencia de la caja (Cierre - Esperado) */
export function calculateCashRegisterDifference(
  expectedAmount: number,
  closingAmount: number
): number {
  return closingAmount - expectedAmount;
}

// FUNCIONES DE UTILIDAD GENERAL
// -----------------------------

/** Valida si la suma de pagos cubre el monto pendiente con una tolerancia mínima */
export function validatePaymentTotal(
  pendingAmount: number,
  payments: { amount: number }[]
): boolean {
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  // Comprueba si la diferencia absoluta es menor a 0.01 (para manejar imprecisiones de coma flotante)
  return Math.abs(total - pendingAmount) < 0.01;
}

/** Suma los números en un array */
export function sumArray(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}

/**
 * Calcula el porcentaje de un valor respecto a un total.
 * @returns Porcentaje redondeado a dos decimales
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 10000) / 100;
}