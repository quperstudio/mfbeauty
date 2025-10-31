import { ClientFilterType, ClientSortField } from '../types/database';

// CONSTANTES DE PANTALLA Y LÍMITES
// --------------------------------
export const MOBILE_BREAKPOINT = 640;

export const CLIENT_SOCIAL_MEDIA_LIMIT = {
  DESKTOP: null,
  MOBILE: 1, // Límite de redes sociales visibles en vista móvil
} as const;

export const NOTE_TRUNCATE_LENGTH = 200; // Máxima longitud para truncar notas

// CONSTANTES DE FILTRADO
// ----------------------
export const CLIENT_FILTER_LABELS: Record<ClientFilterType, string> = {
  all: 'Todos',
  with_visits: 'Con Visitas',
  with_sales: 'Con Ventas',
  referred: 'Referidos',
};

export const CLIENT_FILTER_TYPES: ClientFilterType[] = [
  'all',
  'with_visits',
  'with_sales',
  'referred',
];

// CONSTANTES DE ORDENACIÓN
// -------------------------
export const CLIENT_SORT_FIELDS: ClientSortField[] = [
  'name',
  'total_spent',
  'total_visits',
  'last_visit_date',
  'created_at',
];

// CONSTANTES DE TABLA
// --------------------
export const CLIENT_TABLE_COLUMNS = {
  CHECKBOX: 'Checkbox',
  NAME: 'Cliente',
  CONTACT: 'Contacto',
  VISITS: 'Visitas',
  SPENT: 'Gastado',
  LAST_VISIT: 'Última Visita',
  ACTIONS: 'Acciones',
} as const;

// CONSTANTE: ESTADO INICIAL DEL FORMULARIO
// ----------------------------------------
export const initialFormData = {
  name: '',
  phone: '',
  birthday: null,
  notes: '',
  referrer_id: '',
};