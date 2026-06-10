"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
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

type SimplifiedPayment = Balance

const ALL_GROUPS = "all"

export default function BalancesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<Balance[]>([])
  const [simplified, setSimplified] = useState<SimplifiedPayment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>(ALL_GROUPS)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const groupsResponse = await api.get<Group[]>("/groups")
      setGroups(groupsResponse.data ?? [])

      // /expenses/balances takes ?groupId=X for per-group filtering.
      const balancesResponse = await api.get<Balance[]>("/expenses/balances", {
        params:
          selectedGroup === ALL_GROUPS ? undefined : { groupId: selectedGroup },
      })
      setBalances(balancesResponse.data ?? [])

      // Simplified group-wide payments only make sense when scoped to a
      // single group. /expenses/balances/simplified runs greedy
      // min-cash-flow against the group's expense graph and returns the
      // minimum set of payments that nets everyone to zero.
      if (selectedGroup !== ALL_GROUPS) {
        const simplifiedResponse = await api.get<SimplifiedPayment[]>(
          "/expenses/balances/simplified",
          { params: { groupId: selectedGroup } },
        )
        setSimplified(simplifiedResponse.data ?? [])
      } else {
        setSimplified([])
      }
    } catch (error) {
      console.error("Error fetching balances:", error)
      setBalances([])
      setSimplified([])
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

  const isGroupView = selectedGroup !== ALL_GROUPS
  // Settlements are cross-group: hide the Settle Up button in the per-group
  // view to avoid implying it nets the per-group balance specifically.
  const settleUpEnabled = !isGroupView

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balances</h1>
          <p className="text-muted-foreground">
            {isGroupView
              ? "Pair-by-pair view, plus the minimum set of payments that nets everyone to zero."
              : "Who owes you, who you owe, and a Settle Up button for each."}
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

      {/* Simplified group payments — only meaningful inside a single group. */}
      {isGroupView ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Simplified payments</CardTitle>
            <CardDescription>
              The fewest payments that fully settle this group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : simplified.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payments needed — everyone in this group is settled.
              </p>
            ) : (
              <div className="space-y-3">
                {simplified.map((tx, index) => (
                  <div
                    key={`${tx.from}-${tx.to}-${index}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback>
                          {tx.fromName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{tx.fromName}</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span>${tx.amount.toFixed(2)}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{tx.toName}</span>
                      <Avatar className="h-7 w-7">
                        <AvatarFallback>
                          {tx.toName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Per-pair balances (always shown). */}
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
            // Backend returns from = current user always. amount > 0 means
            // the other party owes you; amount < 0 means you owe them.
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
