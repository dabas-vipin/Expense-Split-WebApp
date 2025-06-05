"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { ExpenseCard } from "@/components/expense-card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Edit, Trash, ArrowLeft, Plus, Users } from "lucide-react"
import { Group } from "@/src/contracts/group"
import { BalanceResponse } from "@/src/contracts/user"
import { Expense } from "@/src/contracts/expense"

interface AddExpenseFormData {
  description: string;
  amount: number;
  paidBy: string;
  groupId: string;
  splitType: 'equal' | 'unequal';
  splitDetails?: Record<string, number>;
}

export default function GroupDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [group, setGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<BalanceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true)

        // Fetch group details
        const groupResponse = await api.get(`/groups/${id}`)
        setGroup(groupResponse.data)
        setExpenses(groupResponse.data.expenses || [])

        // Fetch group balances
        const balancesResponse = await api.get('/expenses/balances', {
          params: { groupId: id }
        })
        setBalances(balancesResponse.data || [])
      } catch (error) {
        console.error("Error fetching group data:", error)
        toast({
          title: "Error",
          description: "Failed to load group details",
          variant: "destructive",
        })
        // Reset states on error
        setExpenses([])
        setBalances([])
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }

    if (user && id) {
      fetchGroupData()
    }
  }, [user, id, page, toast])

  const handleDelete = async () => {
    try {
      await api.delete(`/groups/${id}`)
      toast({
        title: "Success",
        description: "Group deleted successfully",
      })
      router.push("/groups")
    } catch (error) {
      console.error("Error deleting group:", error)
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      })
    }
  }

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses/group/${id}?page=${page}&limit=10`)
      if (!response.ok) {
        throw new Error('Failed to fetch expenses')
      }
      const data = await response.json()
      setExpenses(data.expenses)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError('Failed to load expenses')
      console.error('Error fetching expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (data: AddExpenseFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add an expense",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          groupId: id,
          paidBy: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      toast({
        title: "Success",
        description: "Expense added successfully",
      });

      // Refresh expenses
      fetchExpenses();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add useEffect for navigation
  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  // Remove direct router.push
  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {group && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{group.name}</CardTitle>
                  {group.description && <CardDescription>{group.description}</CardDescription>}
                </div>
                <div className="flex gap-2">
                  <Link href={`/expenses/new?groupId=${id}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => router.push(`/groups/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the group and remove all
                          associations to expenses.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{group.members?.length || 0} Members</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.members?.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 border rounded-full px-3 py-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.avatar || "/placeholder.svg?height=24&width=24"} alt={member.name} />
                      <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="expenses">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="balances">Balances</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="mt-6">
              {expenses?.length > 0 ? (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <ExpenseCard 
                      key={expense.id} 
                      expense={{
                        ...expense,
                        amount: parseFloat(expense.amount)
                      }} 
                    />
                  ))}
                  <div className="flex justify-between items-center mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setPage((p) => Math.max(p - 1, 1))} 
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <h3 className="text-lg font-medium">No expenses found</h3>
                  <p className="text-muted-foreground mb-6">Create your first expense to get started</p>
                  <Link href={`/expenses/new?groupId=${id}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="balances" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Group Balances</CardTitle>
                  <CardDescription>See who owes what in this group</CardDescription>
                </CardHeader>
                <CardContent>
                  {balances.length > 0 ? (
                    <div className="space-y-4">
                      {balances.map((balance, index) => (
                        <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={`/placeholder.svg?height=32&width=32`}
                                alt={balance.fromName}
                              />
                              <AvatarFallback>{balance.fromName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{balance.fromName}</span>
                          </div>
                          <div
                            className={balance.amount > 0 ? "text-green-600" : balance.amount < 0 ? "text-red-600" : ""}
                          >
                            {balance.amount > 0
                              ? `gets back $${balance.amount.toFixed(2)}`
                              : balance.amount < 0
                                ? `owes $${Math.abs(balance.amount).toFixed(2)}`
                                : "settled up"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">No balances to display</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

