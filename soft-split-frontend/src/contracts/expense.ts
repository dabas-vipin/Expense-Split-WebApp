export interface Expense {
  id: string
  description: string
  amount: string
  date: string
  splitType: string
  splitDetails: Record<string, number>
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
} 