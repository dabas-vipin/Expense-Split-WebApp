"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { ActivityEvent, PaginatedActivity } from "@/src/contracts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ActivityFeedProps {
  /** Number of events to fetch. Defaults to 5. */
  limit?: number
  /** External trigger to refetch — bump this when something happens that
   *  would add an event (e.g. just-recorded settlement). */
  refreshKey?: number
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

/** A single rendered row: avatar + line + optional sub-line + timestamp. */
function row(
  avatarName: string,
  line: React.ReactNode,
  createdAt: string,
  subLine?: React.ReactNode,
) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{avatarName.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 text-sm">
        <div>{line}</div>
        {subLine ? (
          <div className="text-xs text-muted-foreground mt-0.5">{subLine}</div>
        ) : null}
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatRelative(createdAt)}
        </div>
      </div>
    </div>
  )
}

function renderEvent(event: ActivityEvent, currentUserId: string) {
  const isActor = event.actor.id === currentUserId
  const isRecipient = event.recipient?.id === currentUserId
  const actorName = event.actor.name
  const otherName = event.recipient?.name ?? "someone"

  switch (event.type) {
    case "settlement": {
      const amount = Number.parseFloat(event.payload?.amount ?? "0")
      const note = event.payload?.note as string | undefined
      let line: React.ReactNode
      if (isActor && event.recipient) {
        line = (
          <>
            You paid <span className="font-medium">{otherName}</span>{" "}
            <span className="font-medium">${amount.toFixed(2)}</span>
          </>
        )
      } else if (isRecipient) {
        line = (
          <>
            <span className="font-medium">{actorName}</span> paid you{" "}
            <span className="font-medium">${amount.toFixed(2)}</span>
          </>
        )
      } else {
        line = (
          <>
            <span className="font-medium">{actorName}</span> paid{" "}
            <span className="font-medium">{otherName}</span>{" "}
            <span className="font-medium">${amount.toFixed(2)}</span>
          </>
        )
      }
      return row(
        actorName,
        line,
        event.createdAt,
        note ? `"${note}"` : undefined,
      )
    }

    case "friend_request_accepted": {
      // Backend emits with actor=accepter, recipient=original requester.
      const line = isActor ? (
        <>
          You're now friends with{" "}
          <span className="font-medium">{otherName}</span>
        </>
      ) : (
        <>
          <span className="font-medium">{actorName}</span> accepted your friend
          request
        </>
      )
      return row(actorName, line, event.createdAt)
    }

    case "group_invitation_sent": {
      const groupName = event.payload?.groupName ?? "a group"
      const line = isActor ? (
        <>
          You invited <span className="font-medium">{otherName}</span> to{" "}
          <span className="font-medium">{groupName}</span>
        </>
      ) : (
        <>
          <span className="font-medium">{actorName}</span> invited you to{" "}
          <span className="font-medium">{groupName}</span>
        </>
      )
      return row(actorName, line, event.createdAt)
    }

    case "group_invitation_accepted": {
      const groupName = event.payload?.groupName ?? "a group"
      // actor = invitee who accepted; recipient = original inviter.
      const line = isActor ? (
        <>
          You joined <span className="font-medium">{groupName}</span>
        </>
      ) : (
        <>
          <span className="font-medium">{actorName}</span> accepted your
          invitation to <span className="font-medium">{groupName}</span>
        </>
      )
      return row(actorName, line, event.createdAt)
    }

    case "expense_created": {
      const description = event.payload?.description ?? "an expense"
      const amountStr = event.payload?.amount
      const amount =
        typeof amountStr === "string" || typeof amountStr === "number"
          ? Number.parseFloat(String(amountStr))
          : null
      const groupName = event.payload?.groupName as string | null | undefined
      const amountFragment =
        amount != null && Number.isFinite(amount) ? (
          <>
            {" "}
            (<span className="font-medium">${amount.toFixed(2)}</span>)
          </>
        ) : null
      const groupFragment = groupName ? (
        <>
          {" "}
          in <span className="font-medium">{groupName}</span>
        </>
      ) : null
      const line = isActor ? (
        <>
          You added <span className="font-medium">{description}</span>
          {amountFragment}
          {groupFragment}
        </>
      ) : (
        <>
          <span className="font-medium">{actorName}</span> added{" "}
          <span className="font-medium">{description}</span>
          {amountFragment}
          {groupFragment}
        </>
      )
      return row(actorName, line, event.createdAt)
    }

    default:
      // Unknown future event types — render the type as a hint instead of
      // throwing, so older clients still load when new types land.
      return (
        <div className="text-sm text-muted-foreground py-2">{event.type}</div>
      )
  }
}

export function ActivityFeed({ limit = 5, refreshKey = 0 }: ActivityFeedProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<ActivityEvent[]>([])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<PaginatedActivity>("/activity", {
        params: { page: 1, limit },
      })
      setEvents(res.data?.data ?? [])
    } catch (error) {
      console.error("activity fetch failed", error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    if (user) fetchEvents()
  }, [user, fetchEvents, refreshKey])

  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          Settlements, invitations, expenses, and friend updates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Nothing here yet. Settle up with a friend to start a feed.
          </p>
        ) : (
          <div className="divide-y">
            {events.map((event) => (
              <div key={event.id}>{renderEvent(event, user.id)}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
