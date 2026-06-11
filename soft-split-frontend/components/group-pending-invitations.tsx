"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { GroupInvitation } from "@/src/contracts"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface GroupPendingInvitationsProps {
  /** Called after the user accepts or rejects an invitation. */
  onResponded?: () => void
}

export function GroupPendingInvitations({
  onResponded,
}: GroupPendingInvitationsProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<GroupInvitation[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchInvitations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<GroupInvitation[]>(
        "/group-invitations/pending",
      )
      setInvitations(res.data ?? [])
    } catch (error) {
      console.error("pending invitations fetch failed", error)
      setInvitations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchInvitations()
  }, [user, fetchInvitations])

  const respond = async (invitationId: string, accept: boolean) => {
    try {
      setBusyId(invitationId)
      await api.post(`/group-invitations/${invitationId}/respond`, { accept })
      toast({
        title: accept ? "Invitation accepted" : "Invitation declined",
        description: accept
          ? "You've joined the group."
          : "The inviter won't be notified.",
      })
      await fetchInvitations()
      onResponded?.()
    } catch (error) {
      console.error("respond failed", error)
    } finally {
      setBusyId(null)
    }
  }

  if (!user) return null
  if (!loading && invitations.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group invitations</CardTitle>
        <CardDescription>
          Groups other users have invited you to join.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {invitation.inviter.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{invitation.group.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Invited by {invitation.inviter.name}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === invitation.id}
                    onClick={() => respond(invitation.id, false)}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    disabled={busyId === invitation.id}
                    onClick={() => respond(invitation.id, true)}
                  >
                    {busyId === invitation.id ? "…" : "Accept"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
