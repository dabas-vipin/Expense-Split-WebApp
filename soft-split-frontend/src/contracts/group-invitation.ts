export type GroupInvitationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'

export interface GroupInvitation {
  id: string
  status: GroupInvitationStatus
  createdAt: string
  respondedAt: string | null
  group: { id: string; name: string }
  inviter: { id: string; name: string; avatar?: string | null }
  invitee: { id: string; name: string; email: string }
}

export interface CreateGroupInvitationPayload {
  email: string
}
