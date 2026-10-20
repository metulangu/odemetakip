export type UserRole = 'ADMIN' | 'MEMBER';
export type UserStatus = 'APPROVED' | 'PENDING' | 'BLOCKED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isSystem?: boolean;
}

export type ExpenseCategory = string;

export interface ExpenseItem {
  id: string;
  name: string;
  category: ExpenseCategory;
  defaultDueDay: number; // 1 to 31
  iconName?: string;
  notes?: string;
  isActive: boolean;
  order: number;
}

export interface MonthlyEntry {
  id: string; // `${expenseItemId}-${year}-${month}`
  expenseItemId: string;
  year: number;
  month: number; // 1 to 12
  amount: number;
  isPaid: boolean;
  paidAt?: string;
  notes?: string;
}

export type DueBadgeStatus = 'comfortable' | 'approaching' | 'critical' | 'overdue' | 'paid';

export interface DueCalculation {
  daysLeft: number;
  status: DueBadgeStatus;
  label: string;
  dueDateStr: string;
}

export type ViewMode = 'monthly' | 'yearly' | 'multiyear';
