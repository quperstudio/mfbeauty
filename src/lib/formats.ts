import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { SOCIAL_MEDIA_BASE_URLS, SocialMediaType } from './constants';
import { MessageCircle, Facebook, Instagram, Music2 } from 'lucide-react';

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
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

export function parsePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function cleanPhoneInput(value: string): string {
  let cleaned = value.trim();

  if (cleaned.startsWith('+52')) {
    cleaned = cleaned.substring(3).trim();
  } else if (cleaned.startsWith('+1')) {
    cleaned = cleaned.substring(2).trim();
  }

  return cleaned.replace(/\D/g, '').slice(0, 10);
}

export function formatPhoneRealTime(value: string): string {
  const digits = cleanPhoneInput(value);

  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
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

export function cleanSocialMediaInput(type: SocialMediaType, value: string): string {
  if (!value) return '';

  let cleaned = value.trim();

  if (type === 'whatsapp') {
    return cleaned.replace(/\D/g, '');
  }

  if (type === 'facebook') {
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?facebook\.com\//i, '');
    cleaned = cleaned.replace(/^www\.facebook\.com\//i, '');
    cleaned = cleaned.replace(/\/$/, '');
    cleaned = cleaned.split('?')[0];
    return cleaned;
  }

  if (type === 'instagram') {
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
    cleaned = cleaned.replace(/^www\.instagram\.com\//i, '');
    cleaned = cleaned.replace(/^@/, '');
    cleaned = cleaned.replace(/\/$/, '');
    cleaned = cleaned.split('?')[0];
    return cleaned;
  }

  if (type === 'tiktok') {
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '');
    cleaned = cleaned.replace(/^www\.tiktok\.com\/@?/i, '');
    cleaned = cleaned.replace(/^@/, '');
    cleaned = cleaned.replace(/\/$/, '');
    cleaned = cleaned.split('?')[0];
    return cleaned;
  }

  return cleaned;
}

export function buildSocialMediaUrl(type: SocialMediaType, username: string | null | undefined): string {
  if (!username || !username.trim()) return '';

  const cleanedUsername = username.trim();
  const baseUrl = SOCIAL_MEDIA_BASE_URLS[type];

  if (!baseUrl) return '';

  return `${baseUrl}${cleanedUsername}`;
}

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
