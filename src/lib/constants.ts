export const PHONE_REGEX = /^\d{10}$/;

export const CARD_COMMISSION_RATE = 0.035;

export const IVA_RATE = 0.16;

export const CARD_TOTAL_COMMISSION_RATE = CARD_COMMISSION_RATE * (1 + IVA_RATE);

export const DATE_FORMAT = 'dd/MM/yyyy';

export const TIME_FORMAT = 'hh:mm a';

export const DATETIME_FORMAT = 'dd/MM/yyyy hh:mm a';

export const TIMEZONE = 'America/Tijuana';

export const CURRENCY = 'MXN';

export const APPOINTMENT_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELED: 'canceled'
} as const;

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer'
} as const;

export const COMMISSION_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed'
} as const;

export const USER_ROLES = {
  ADMINISTRATOR: 'administrator',
  EMPLOYEE: 'employee'
} as const;

export const APPOINTMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  canceled: 'bg-red-100 text-red-800 border-red-200'
} as const;

export const APPOINTMENT_STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  canceled: 'Cancelada'
} as const;

export const PAYMENT_METHOD_LABELS = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia'
} as const;

export const TRANSACTION_TYPE_LABELS = {
  income: 'Ingreso',
  expense: 'Gasto'
} as const;

export const USER_ROLE_LABELS = {
  administrator: 'Administrador',
  employee: 'Empleado'
} as const;
