import { UserRole } from '../types/database';

export function isAdministrator(role: UserRole): boolean {
  return role === 'administrator';
}

export function isEmployee(role: UserRole): boolean {
  return role === 'employee';
}

export function canDeleteClients(role: UserRole): boolean {
  return isAdministrator(role);
}

export function canDeleteServices(role: UserRole): boolean {
  return isAdministrator(role);
}

export function canDeleteCategories(role: UserRole): boolean {
  return isAdministrator(role);
}

export function canDeleteAgents(role: UserRole): boolean {
  return isAdministrator(role);
}

export function canDeleteAppointments(role: UserRole): boolean {
  return isAdministrator(role);
}

export function canDeleteTransactions(role: UserRole): boolean {
  return isAdministrator(role);
}

export function canManageUsers(role: UserRole): boolean {
  return isAdministrator(role);
}

export function canViewFinancialReports(role: UserRole): boolean {
  return isAdministrator(role);
}

export function canManageCashRegister(role: UserRole): boolean {
  return true;
}

export function canViewCommissions(role: UserRole): boolean {
  return true;
}

export function canPayCommissions(role: UserRole): boolean {
  return isAdministrator(role);
}

export function canCreateClients(role: UserRole): boolean {
  return true;
}

export function canEditClients(role: UserRole): boolean {
  return true;
}

export function canCreateAppointments(role: UserRole): boolean {
  return true;
}

export function canEditAppointments(role: UserRole): boolean {
  return true;
}

export function canProcessPayments(role: UserRole): boolean {
  return true;
}
