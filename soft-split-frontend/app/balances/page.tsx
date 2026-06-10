"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Group } from "@/src/contracts"
import { SettleUpModal } from "@/components/settle-up-modal"

interface Balance {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
}

const ALL_GROUPS = "all"

export default function BalancesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<Balance[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>(ALL_GROUPS)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const groupsResponse = await api.get<Group[]>("/groups")
      setGroups(groupsResponse.data ?? [])

      // /expenses/balances takes ?groupId=X for per-group filtering; the
      // previous /expenses/balances/${id} path shape did not exist on the
      // backend and silently 404'd, so per-group filter was always broken.
      const balancesResponse = await api.get<Balance[]>("/expenses/balances", {
        params:
          selectedGroup === ALL_GROUPS ? undefined : { groupId: selectedGroup },
      })
      setBalances(balancesResponse.data ?? [])
    } catch (error) {
      console.error("Error fetching balances:", error)
      setBalances([])
    } finally {
      setLoading(false)
    }
  }, [selectedGroup])

  useEffect(() => {
    if (user) fetchData()
  }, [user, fetchData])

  if (!user) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">
          Please login to view your balances
        </h1>
        <Link href="/login">
          <Button>Login</Button>
        </Link>
      </div>
    )
  }

  // Settlements are cross-group: only meaningful to settle when we're looking
  // at the cross-group view. In a per-group filter the settle-up control is
  // hidden to avoid implying it nets the per-group balance specifically.
  const settleUpEnabled = selectedGroup === ALL_GROUPS

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balances</h1>
          <p className="text-muted-foreground">
            Who owes you, who you owe, and a Settle Up button for each.
          </p>
        </div>
        <div className="w-full md:w-[220px]">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_GROUPS}>All groups</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : balances.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <h3 className="text-lg font-medium">All settled up</h3>
            <p className="text-muted-foreground">
              No outstanding balances on this view.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {balances.map((balance) => {
            // Backend always returns `from = current user`. Positive amount
            // = the other party owes you; negative = you owe them.
            const owedToYou = balance.amount > 0
            const magnitude = Math.abs(balance.amount)
            const otherName = balance.toName
            const otherId = balance.to

            return (
              <Card key={`${otherId}-${owedToYou}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src="/placeholder.svg?height=40&width=40"
                        alt={otherName}
                      />
                      <AvatarFallback>
                        {otherName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{otherName}</div>
                      <div className="text-sm text-muted-foreground">
                        {owedToYou ? "owes you" : "you owe"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={owedToYou ? "default" : "outline"}
                      className={
                        owedToYou
                          ? "bg-green-500/15 text-green-700 hover:bg-green-500/20"
                          : "border-orange-500/30 text-orange-700"
                      }
                    >
                      {owedToYou ? "in your favor" : "you owe"}
                    </Badge>
                    <div className="text-xl font-bold">
                      ${magnitude.toFixed(2)}
                    </div>
                  </div>
                  {!owedToYou && settleUpEnabled ? (
                    <div className="mt-4">
                      <SettleUpModal
                        payeeId={otherId}
                        payeeName={otherName}
                        outstanding={magnitude}
                        onSettled={fetchData}
                        triggerClassName="w-full"
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
