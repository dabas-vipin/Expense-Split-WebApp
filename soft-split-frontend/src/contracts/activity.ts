import { User } from './user'

export type ActivityEventType =
  | 'settlement'
  | 'friend_request_accepted'
  | 'group_invitation_sent'
  | 'group_invitation_accepted'
  | 'expense_created'

export interface ActivityEvent {
  id: string
  // The backend stores any string; the union above is what the current
  // frontend knows how to render. Unknown values fall through to a generic
  // renderer so older clients don't break when new event types ship.
  type: ActivityEventType | string
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
