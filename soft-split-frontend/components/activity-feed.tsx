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

function renderEvent(event: ActivityEvent, currentUserId: string) {
  if (event.type === "settlement") {
    const amount = Number.parseFloat(event.payload?.amount ?? "0")
    const note = event.payload?.note as string | undefined
    const youArePayer = event.actor.id === currentUserId
    const youArePayee = event.recipient?.id === currentUserId

    let line: React.ReactNode
    if (youArePayer && event.recipient) {
      line = (
        <>
          You paid <span className="font-medium">{event.recipient.name}</span>{" "}
          <span className="font-medium">${amount.toFixed(2)}</span>
        </>
      )
    } else if (youArePayee) {
      line = (
        <>
          <span className="font-medium">{event.actor.name}</span> paid you{" "}
          <span className="font-medium">${amount.toFixed(2)}</span>
        </>
      )
    } else {
      // Shouldn't usually happen since the backend filters to events
      // involving the current user, but render something safe.
      line = (
        <>
          <span className="font-medium">{event.actor.name}</span> paid{" "}
          <span className="font-medium">{event.recipient?.name ?? "someone"}</span>{" "}
          <span className="font-medium">${amount.toFixed(2)}</span>
        </>
      )
    }

    return (
      <div className="flex items-start gap-3 py-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {event.actor.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-sm">
          <div>{line}</div>
          {note ? (
            <div className="text-xs text-muted-foreground mt-0.5">"{note}"</div>
          ) : null}
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatRelative(event.createdAt)}
          </div>
        </div>
      </div>
    )
  }
  // Unknown future event types — render the type as a hint.
  return (
    <div className="text-sm text-muted-foreground py-2">{event.type}</div>
  )
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
        <CardDescription>Settlements and other updates</CardDescription>
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
