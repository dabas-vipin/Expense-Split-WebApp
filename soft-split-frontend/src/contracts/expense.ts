export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'lodging',
  'entertainment',
  'utilities',
  'shopping',
  'other',
] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface Expense {
  id: string
  description: string
  amount: string
  date: string
  splitType: string
  splitDetails: Record<string, number>
  category: ExpenseCategory
  currency: string
  notes: string | null
  paidBy: {
    id: string
    name: string
  }
  participants: Array<{
    id: string
    name: string
  }>
  group?: {
    id: string
    name: string
  }
}

// Extended interface with additional properties
export interface ExpenseWithDetails extends Omit<Expense, 'amount'> {
  amount: number;
  paidBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
}

export interface ExpenseCreate {
  description: string
  amount: number
  date: string
  paidById: string
  participantIds: string[]
  groupId: string | null
  splitType: string
  splitDetails: Record<string, number>
  category?: ExpenseCategory
  currency?: string
  notes?: string
} 