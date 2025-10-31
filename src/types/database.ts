export type UserRole = 'administrator' | 'employee';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'canceled';

export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export type CommissionType = 'percentage' | 'fixed';

export type CommissionStatus = 'pending' | 'paid';

export type CashRegisterStatus = 'open' | 'closed';

export type SocialMediaType = 'whatsapp' | 'facebook' | 'instagram' | 'tiktok';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  birthday?: string;
  notes?: string;
  referrer_id?: string;
  whatsapp_link?: string;
  facebook_link?: string;
  instagram_link?: string;
  tiktok_link?: string;
  total_spent: number;
  total_visits: number;
  last_visit_date?: string;
  created_by_user_id?: string;
  created_at: string;
}

export interface ClientTag {
  id: string;
  name: string;
  created_at: string;
}

export interface ClientTagAssignment {
  id: string;
  client_id: string;
  tag_id: string;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  created_at: string;
}

export interface Service {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  cost: number;
  profit: number;
  created_at: string;
}

export interface CommissionAgent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  base_commission_percentage: number;
  active: boolean;
  notes?: string;
  whatsapp_link?: string;
  facebook_link?: string;
  instagram_link?: string;
  tiktok_link?: string;
  created_at: string;
}

export interface ServiceCommission {
  id: string;
  service_id: string;
  agent_id: string;
  commission_type: CommissionType;
  commission_value: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  total_price: number;
  deposit: number;
  balance_pending: number;
  notes?: string;
  created_by_user_id?: string;
  created_at: string;
}

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string;
  price_at_booking: number;
  created_at: string;
}

export interface AppointmentAgent {
  id: string;
  appointment_id: string;
  agent_id: string;
  created_at: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category_id?: string;
  payment_method: PaymentMethod;
  gross_amount: number;
  card_commission: number;
  net_amount: number;
  description: string;
  transaction_date: string;
  transaction_time: string;
  client_id?: string;
  appointment_id?: string;
  created_by_user_id?: string;
  created_at: string;
}

export interface Commission {
  id: string;
  agent_id: string;
  appointment_id: string;
  service_id: string;
  amount: number;
  commission_rate: number;
  commission_type: CommissionType;
  status: CommissionStatus;
  generated_date: string;
  paid_date?: string;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  payment_notes?: string;
  created_at: string;
}

export interface CashRegisterSession {
  id: string;
  opened_by_user_id: string;
  closed_by_user_id?: string;
  opening_amount: number;
  closing_amount?: number;
  expected_amount?: number;
  difference?: number;
  opening_notes?: string;
  closing_notes?: string;
  opened_at: string;
  closed_at?: string;
  status: CashRegisterStatus;
}

export interface AppointmentWithDetails extends Appointment {
  client: Client;
  services: (AppointmentService & { service: Service })[];
  agents: (AppointmentAgent & { agent: CommissionAgent })[];
  created_by: User;
}

export interface TransactionWithDetails extends Transaction {
  category?: TransactionCategory;
  client?: Client;
  appointment?: Appointment;
  created_by?: User;
}

export interface CommissionWithDetails extends Commission {
  agent: CommissionAgent;
  appointment: Appointment;
  service: Service;
}

export interface ServiceWithCategory extends Service {
  category: ServiceCategory;
}

export interface ClientWithReferrer extends Client {
  referrer?: Client;
}

export type ClientFilterType = 'all' | 'with_visits' | 'with_sales' | 'referred';

export type ClientSortField = 'name' | 'total_spent' | 'total_visits' | 'last_visit_date' | 'created_at';

export type ClientSortDirection = 'asc' | 'desc';

export interface ClientSortOptions {
  field: ClientSortField;
  direction: ClientSortDirection;
}

export interface ClientWithDetails extends Client {
  referrer?: Client;
  appointments?: Appointment[];
  referrals?: Client[];
  tags?: ClientTag[];
  created_by?: User;
}

export interface ClientWithTags extends Client {
  tags: ClientTag[];
}

export interface SocialMedia {
  type: SocialMediaType;
  link: string;
}

export interface SocialMediaFields {
  whatsapp_link?: string | null;
  facebook_link?: string | null;
  instagram_link?: string | null;
  tiktok_link?: string | null;
}

export interface EntityWithSocialMedia {
  whatsapp_link?: string;
  facebook_link?: string;
  instagram_link?: string;
  tiktok_link?: string;
}
