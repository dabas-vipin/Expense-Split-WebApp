import { User } from './user'

export type ActivityEventType = 'settlement'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  actor: Pick<User, 'id' | 'name' | 'avatar'>
  recipient: Pick<User, 'id' | 'name' | 'avatar'> | null
  payload: Record<string, any> | null
  createdAt: string
}

export interface PaginatedActivity {
  data: ActivityEvent[]
  total: number
  page: number
  limit: number
}
