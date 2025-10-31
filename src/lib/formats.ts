import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const dateObj = parseDate(date);
  if (!dateObj) return '';
  return format(dateObj, 'dd/MM/yyyy', { locale: es });
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function parsePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function parseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;

  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }

  if (typeof date === 'string') {
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day);
      return isValid(parsedDate) ? parsedDate : null;
    }

    const isoDate = parseISO(date);
    return isValid(isoDate) ? isoDate : null;
  }

  return null;
}

export function getCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getCurrentTime(): string {
  return format(new Date(), 'HH:mm');
}

export function formatToISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
