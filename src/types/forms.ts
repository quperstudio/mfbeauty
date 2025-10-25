import { UserRole, AppointmentStatus, TransactionType, PaymentMethod, CommissionType } from './database';

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export interface ClientFormData {
  name: string;
  phone: string;
  birthday?: string;
  notes?: string;
  referrer_id?: string;
  whatsapp_link?: string;
  facebook_link?: string;
  instagram_link?: string;
  tiktok_link?: string;
}

export interface ServiceCategoryFormData {
  name: string;
  description?: string;
  display_order: number;
}

export interface ServiceFormData {
  category_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  cost: number;
}

export interface CommissionAgentFormData {
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
}

export interface ServiceCommissionFormData {
  service_id: string;
  agent_id: string;
  commission_type: CommissionType;
  commission_value: number;
}

export interface AppointmentFormData {
  client_id: string;
  appointment_date: string;
  appointment_time: string;
  status?: AppointmentStatus;
  service_ids: string[];
  agent_ids: string[];
  deposit: number;
  notes?: string;
}

export interface TransactionFormData {
  type: TransactionType;
  category_id?: string;
  payment_method: PaymentMethod;
  gross_amount: number;
  description: string;
  transaction_date: string;
  transaction_time: string;
  client_id?: string;
  appointment_id?: string;
}

export interface TransactionCategoryFormData {
  name: string;
  type: TransactionType;
}

export interface PayCommissionFormData {
  payment_method: PaymentMethod;
  payment_reference?: string;
  payment_notes?: string;
  paid_date: string;
}

export interface OpenCashRegisterFormData {
  opening_amount: number;
  opening_notes?: string;
}

export interface CloseCashRegisterFormData {
  closing_amount: number;
  closing_notes?: string;
}

export interface POSPaymentFormData {
  payments: {
    method: PaymentMethod;
    amount: number;
  }[];
}

export interface UserFormData {
  email: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  password?: string;
}
