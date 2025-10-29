import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { SOCIAL_MEDIA_BASE_URLS, SOCIAL_MEDIA_COLORS } from './constants';
import { MessageCircle, Facebook, Instagram, Music2 } from 'lucide-react';
import { SocialMediaType, SocialMedia, SocialMediaFields, EntityWithSocialMedia, Client } from '../types/database';
import { APPOINTMENT_STATUS_LABELS } from './constants';

// FORMATO DE MONEDA
// -----------------

/** Formatea un número como moneda (MXN) */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// FORMATO Y PARSEO DE FECHAS
// --------------------------

/** Parsea una cadena o Date a un objeto Date válido, o nulo */
export function parseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;

  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }

  if (typeof date === 'string') {
    // Manejar formato corto 'YYYY-MM-DD'
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      // Importante: el mes en Date es base 0
      const parsedDate = new Date(year, month - 1, day);
      return isValid(parsedDate) ? parsedDate : null;
    }

    // Intentar parsear como ISO
    const isoDate = parseISO(date);
    return isValid(isoDate) ? isoDate : null;
  }

  return null;
}

/** Formatea una fecha a 'dd/MM/yyyy' */
export function formatDate(date: string | Date): string {
  const dateObj = parseDate(date);
  if (!dateObj) return '';
  return format(dateObj, 'dd/MM/yyyy', { locale: es });
}

/** Obtiene la fecha actual en formato 'yyyy-MM-dd' */
export function getCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Obtiene la hora actual en formato 'HH:mm' */
export function getCurrentTime(): string {
  return format(new Date(), 'HH:mm');
}

/** Formatea una fecha a formato ISO 'yyyy-MM-dd' */
export function formatToISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// FORMATO Y LIMPIEZA DE TELÉFONO
// ------------------------------

/** Formatea un teléfono de 10 dígitos a (XXX) XXX XXXX */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

/** Limpia el input de teléfono dejando solo 10 dígitos */
export function parsePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

/**
 * Limpia el input de teléfono eliminando prefijos comunes (+52, +1) y dejando solo 10 dígitos
 */
export function cleanPhoneInput(value: string): string {
  let cleaned = value.trim();

  if (cleaned.startsWith('+52')) {
    cleaned = cleaned.substring(3).trim();
  } else if (cleaned.startsWith('+1')) {
    cleaned = cleaned.substring(2).trim();
  }

  return cleaned.replace(/\D/g, '').slice(0, 10);
}

/** Formatea el teléfono mientras el usuario escribe (en tiempo real) */
export function formatPhoneRealTime(value: string): string {
  const digits = cleanPhoneInput(value);

  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
}

// FORMATO Y UTILIDADES DE REDES SOCIALES
// ------------------------------------

/**
 * Limpia el valor de entrada de redes sociales, dejando solo el usuario o número.
 */
export function cleanSocialMediaInput(type: SocialMediaType, value: string): string {
  if (!value) return '';

  let cleaned = value.trim();

  if (type === 'whatsapp') {
    return cleaned.replace(/\D/g, '');
  }

  // Patrón general para limpiar URL: remover dominio, @ (si aplica), y parámetros de consulta
  const cleanUrl = (v: string, domain: string) => {
    let result = v;
    result = result.replace(new RegExp(`^https?:\/\/(www\\.)?${domain}\/?`, 'i'), '');
    result = result.replace(/^@/, '');
    result = result.replace(/\/$/, '');
    result = result.split('?')[0];
    return result;
  };

  if (type === 'facebook') return cleanUrl(cleaned, 'facebook\\.com');
  if (type === 'instagram') return cleanUrl(cleaned, 'instagram\\.com');
  if (type === 'tiktok') return cleanUrl(cleaned, 'tiktok\\.com');

  return cleaned;
}

/** Construye la URL completa de una red social */
export function buildSocialMediaUrl(type: SocialMediaType, username: string | null | undefined): string {
  const cleanedUsername = username?.trim();
  if (!cleanedUsername) return '';

  const baseUrl = SOCIAL_MEDIA_BASE_URLS[type];
  return baseUrl ? `${baseUrl}${cleanedUsername}` : '';
}

/** Obtiene el componente de ícono de Lucide para un tipo de red social */
export function getSocialMediaIcon(type: SocialMediaType) {
  switch (type) {
    case 'whatsapp':
      return MessageCircle;
    case 'facebook':
      return Facebook;
    case 'instagram':
      return Instagram;
    case 'tiktok':
      return Music2;
    default:
      return null;
  }
}

/** Convierte una lista de objetos SocialMedia a un objeto de campos de cliente */
export function mapSocialMediaListToFields(list: SocialMedia[]): SocialMediaFields {
  return list.reduce((acc, sm) => {
    // La clave debe ser 'whatsapp_link', 'facebook_link', etc.
    acc[`${sm.type}_link`] = sm.link;
    return acc;
  }, { 
        whatsapp_link: null, 
        facebook_link: null, 
        instagram_link: null, 
        tiktok_link: null 
    } as SocialMediaFields);
}

/** Convierte los campos de red social de una entidad a una lista de objetos SocialMedia */
export function mapEntityToSocialMediaList(entity: EntityWithSocialMedia): SocialMedia[] {
  const list: SocialMedia[] = [];
  if (entity.whatsapp_link) list.push({ type: 'whatsapp', link: entity.whatsapp_link });
  if (entity.facebook_link) list.push({ type: 'facebook', link: entity.facebook_link });
  if (entity.instagram_link) list.push({ type: 'instagram', link: entity.instagram_link });
  if (entity.tiktok_link) list.push({ type: 'tiktok', link: entity.tiktok_link });
  return list;
}

export interface SocialMediaLink {
  type: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

/**
 * Obtiene la lista de links de redes sociales de una entidad, aplicando un límite de visibilidad
 */
export function getSocialMediaLinks(
  entity: EntityWithSocialMedia,
  limit: number | null = null
): { visibleLinks: SocialMediaLink[]; hiddenCount: number; hiddenLinks: SocialMediaLink[] } {
  const list = mapEntityToSocialMediaList(entity);
  const links: SocialMediaLink[] = list.map(sm => ({
    type: sm.type[0].toUpperCase() + sm.type.slice(1), // Capitalizar (ej. whatsapp -> Whatsapp)
    url: buildSocialMediaUrl(sm.type, sm.link),
    icon: getSocialMediaIcon(sm.type)!,
    color: SOCIAL_MEDIA_COLORS[sm.type],
  }));


  if (limit === null || limit >= links.length) {
    return { visibleLinks: links, hiddenCount: 0, hiddenLinks: [] };
  }

  const visibleLinks = links.slice(0, limit);
  const hiddenLinks = links.slice(limit);
  const hiddenCount = hiddenLinks.length;

  return { visibleLinks, hiddenCount, hiddenLinks };
}

// UTILIDADES DE ESTADO Y DATOS DE USUARIO
// ----------------------------------------

/** Obtiene la variante (color/estilo) para un 'badge' de estado */
export function getStatusBadgeVariant(status: string): 'success' | 'info' | 'warning' | 'destructive' | 'default' {
  switch (status) {
    case 'completed': return 'success';
    case 'confirmed': return 'info';
    case 'pending': return 'warning';
    case 'canceled': return 'destructive';
    default: return 'default';
  }
}

/** Obtiene la etiqueta amigable para un estado de cita */
export function getStatusLabel(status: keyof typeof APPOINTMENT_STATUS_LABELS | string): string {
  if (status in APPOINTMENT_STATUS_LABELS) {
    return APPOINTMENT_STATUS_LABELS[status as keyof typeof APPOINTMENT_STATUS_LABELS];
  }
  return status;
}

/** Obtiene el nombre a mostrar del usuario que creó un registro */
export function getUserDisplayName(client: Client): string {
  if (client.created_by) {
    return client.created_by.name || (client.created_by.role === 'administrator' ? 'Administrador' : 'Empleado');
  }
  return 'Sistema';
}