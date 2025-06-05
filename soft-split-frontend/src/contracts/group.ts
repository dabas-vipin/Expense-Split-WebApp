export interface Group {
  id: string
  name: string
  description: string
  members: GroupMember[]
  createdAt: string
  updatedAt: string
}

export interface GroupMember {
  id: string
  name: string
  avatar?: string
  role: 'admin' | 'member'
} 