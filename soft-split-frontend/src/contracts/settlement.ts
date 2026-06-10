import { User } from './user'

export interface Settlement {
  id: string
  // Amount is decimal(10,2) on the backend — comes back as a string to keep
  // precision through the JSON boundary. Treat as a number via parseFloat.
  amount: string
  note: string | null
  payer: Pick<User, 'id' | 'name' | 'avatar'>
  payee: Pick<User, 'id' | 'name' | 'avatar'>
  createdAt: string
}

export interface CreateSettlementPayload {
  payeeId: string
  amount: number
  note?: string
}

export interface PaginatedSettlements {
  data: Settlement[]
  total: number
  page: number
  limit: number
}
