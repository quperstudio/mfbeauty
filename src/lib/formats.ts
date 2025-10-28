import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { SOCIAL_MEDIA_BASE_URLS, SOCIAL_MEDIA_COLORS } from './constants';
import { MessageCircle, Facebook, Instagram, Music2 } from 'lucide-react';
import { SocialMediaType, SocialMedia, SocialMediaFields, EntityWithSocialMedia } from '../types/database';

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

export function mapSocialMediaListToFields(list: SocialMedia[]): SocialMediaFields {
  const socialMediaFields = list.reduce((acc, sm) => {
    acc[`${sm.type}_link`] = sm.link;
    return acc;
  }, {} as Record<string, string>);

  return {
    whatsapp_link: socialMediaFields.whatsapp_link || null,
    facebook_link: socialMediaFields.facebook_link || null,
    instagram_link: socialMediaFields.instagram_link || null,
    tiktok_link: socialMediaFields.tiktok_link || null,
  };
}

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

export function getSocialMediaLinks(
  entity: EntityWithSocialMedia,
  limit: number | null = null
): { visibleLinks: SocialMediaLink[]; hiddenCount: number; hiddenLinks: SocialMediaLink[] } {
  const links: SocialMediaLink[] = [];

  if (entity.whatsapp_link) {
    links.push({
      type: 'WhatsApp',
      url: buildSocialMediaUrl('whatsapp', entity.whatsapp_link),
      icon: getSocialMediaIcon('whatsapp')!,
      color: SOCIAL_MEDIA_COLORS.whatsapp,
    });
  }
  if (entity.facebook_link) {
    links.push({
      type: 'Facebook',
      url: buildSocialMediaUrl('facebook', entity.facebook_link),
      icon: getSocialMediaIcon('facebook')!,
      color: SOCIAL_MEDIA_COLORS.facebook,
    });
  }
  if (entity.instagram_link) {
    links.push({
      type: 'Instagram',
      url: buildSocialMediaUrl('instagram', entity.instagram_link),
      icon: getSocialMediaIcon('instagram')!,
      color: SOCIAL_MEDIA_COLORS.instagram,
    });
  }
  if (entity.tiktok_link) {
    links.push({
      type: 'TikTok',
      url: buildSocialMediaUrl('tiktok', entity.tiktok_link),
      icon: getSocialMediaIcon('tiktok')!,
      color: SOCIAL_MEDIA_COLORS.tiktok,
    });
  }

  if (limit === null) {
    return { visibleLinks: links, hiddenCount: 0, hiddenLinks: [] };
  }

  const visibleLinks = links.slice(0, limit);
  const hiddenCount = links.length - visibleLinks.length;
  const hiddenLinks = links.slice(limit);

  return { visibleLinks, hiddenCount, hiddenLinks };
}
