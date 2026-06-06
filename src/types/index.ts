export type CategoryType = 'nha_trai' | 'nha_gai' | 'chung';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  estimated_cost: number;
  actual_cost: number;
  assignee: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

export const WEDDING_DATE = new Date('2026-12-20T08:00:00');

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Chưa bắt đầu',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Quan trọng',
};

export const TYPE_LABELS: Record<CategoryType, string> = {
  chung: 'Việc chung',
  nha_trai: 'Nhà trai',
  nha_gai: 'Nhà gái',
};

export const TYPE_COLORS: Record<CategoryType, string> = {
  chung: 'rose',
  nha_trai: 'violet',
  nha_gai: 'amber',
};

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1) + ' tỷ';
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(0) + ' tr';
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'k';
  return amount.toString();
}

export function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
