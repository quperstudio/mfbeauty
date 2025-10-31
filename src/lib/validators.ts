import { PHONE_REGEX } from './constants';

export function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePositiveNumber(value: number): boolean {
  return !isNaN(value) && value > 0;
}

export function validateNonNegativeNumber(value: number): boolean {
  return !isNaN(value) && value >= 0;
}

export function validateRequired(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

export function validatePercentage(value: number): boolean {
  return !isNaN(value) && value >= 0 && value <= 100;
}

export function validateServiceCost(price: number, cost: number): boolean {
  return validatePositiveNumber(price) && validateNonNegativeNumber(cost) && cost < price;
}

export function validateDeposit(total: number, deposit: number): boolean {
  return validateNonNegativeNumber(deposit) && deposit <= total;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function getPhoneError(phone: string): string | null {
  if (!validateRequired(phone)) {
    return 'El teléfono es requerido';
  }
  if (!validatePhone(phone)) {
    return 'El teléfono debe tener exactamente 10 dígitos';
  }
  return null;
}

export function getEmailError(email: string): string | null {
  if (!validateRequired(email)) {
    return 'El email es requerido';
  }
  if (!validateEmail(email)) {
    return 'El email no es válido';
  }
  return null;
}

export function getRequiredError(fieldName: string): string {
  return `${fieldName} es requerido`;
}

export function getPositiveNumberError(fieldName: string): string {
  return `${fieldName} debe ser un número positivo`;
}

export function getPercentageError(fieldName: string): string {
  return `${fieldName} debe estar entre 0 y 100`;
}
