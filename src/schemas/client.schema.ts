import { z } from 'zod';

const phoneRegex = /^\d{10}$/;

const emptyStringToNull = z
  .string()
  .transform(val => val?.trim() === '' ? null : val?.trim() || null)
  .nullable()
  .optional();

export const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').trim(),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .regex(phoneRegex, 'El teléfono debe tener exactamente 10 dígitos'),
  birthday: emptyStringToNull,
  notes: emptyStringToNull,
  referrer_id: emptyStringToNull,
  whatsapp_link: emptyStringToNull,
  facebook_link: emptyStringToNull,
  instagram_link: emptyStringToNull,
  tiktok_link: emptyStringToNull,
});

export type ClientSchemaType = z.infer<typeof clientSchema>;
