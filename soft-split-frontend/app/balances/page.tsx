"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight } from "lucide-react"
import { Group } from "@/src/contracts"

interface Balance {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export default function BalancesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<Balance[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch groups
        const groupsResponse = await api.get("/groups")
        setGroups(groupsResponse.data)

        // Fetch balances
        const balancesUrl = selectedGroup === "all" 
          ? "/expenses/balances" 
          : `/expenses/balances/${selectedGroup}`

        const balancesResponse = await api.get(balancesUrl)
        setBalances(balancesResponse.data)
      } catch (error) {
        console.error("Error fetching balances:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, selectedGroup])

  if (!user) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Please login to view your balances</h1>
        <Link href="/login">
          <Button>Login</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balances</h1>
          <p className="text-muted-foreground">See who you owe and who owes you</p>
        </div>
        <div className="mt-4 md:mt-0 w-full md:w-[200px]">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Balances</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="simplified">Simplified Debts</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : balances.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {balances.map((balance, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src="/placeholder.svg?height=40&width=40"
                          alt={balance.fromName}
                        />
                        <AvatarFallback>{balance.fromName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{balance.fromName}</div>
                        <div className="text-sm text-muted-foreground">owes {balance.toName}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {balance.amount > 0 ? "owes you" : "you owe"}
                      </Badge>
                      <div className="text-xl font-bold">${Math.abs(balance.amount).toFixed(2)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-10">
                <h3 className="text-lg font-medium">No balances found</h3>
                <p className="text-muted-foreground mb-6">You don't have any balances to settle</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="simplified" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Simplified Payments</CardTitle>
              <CardDescription>The most efficient way to settle all debts</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : balances.length > 0 ? (
                <div className="space-y-4">
                  {balances.map((balance, index) => (
                    <div key={index} className="flex items-center justify-between border rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src="/placeholder.svg?height=32&width=32"
                            alt={balance.fromName}
                          />
                          <AvatarFallback>{balance.fromName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{balance.fromName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        <div className="font-bold">${balance.amount.toFixed(2)}</div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src="/placeholder.svg?height=32&width=32"
                            alt={balance.toName}
                          />
                          <AvatarFallback>{balance.toName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{balance.toName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No payments needed, everyone is settled up!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

