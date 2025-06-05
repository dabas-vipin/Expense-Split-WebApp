"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
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
import { Edit, Trash, ArrowLeft } from "lucide-react"
import { ExpenseWithDetails } from "@/src/contracts"



export default function ExpenseDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [expense, setExpense] = useState<ExpenseWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/expenses/${id}`)
        setExpense({
          ...response.data,
          amount: parseFloat(response.data.amount)
        })
      } catch (error) {
        console.error("Error fetching expense:", error)
        toast({
          title: "Error",
          description: "Failed to load expense details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user && id) {
      fetchExpense()
    }
  }, [user, id, toast])

  const handleDelete = async () => {
    try {
      await api.delete(`/expenses/${id}`)
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })
      router.push("/expenses")
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="container py-10">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {loading ? (
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : expense ? (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{expense.description}</CardTitle>
                  <CardDescription>{format(new Date(expense.date), "PPP")}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${expense.amount.toFixed(2)}</div>
                  <div className="flex gap-2 justify-end mt-1">
                    {expense.group && <Badge variant="outline">{expense.group.name}</Badge>}
                    <Badge variant="secondary" className="capitalize">
                      {expense.splitType} split
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Paid by</h3>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={expense.paidBy.avatar || "/placeholder.svg?height=32&width=32"}
                      alt={expense.paidBy.name}
                    />
                    <AvatarFallback>{expense.paidBy.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{expense.paidBy.name}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Participants</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {expense.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between border rounded-md p-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={participant.avatar || "/placeholder.svg?height=32&width=32"}
                            alt={participant.name}
                          />
                          <AvatarFallback>{participant.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{participant.name}</span>
                      </div>

                      {expense.splitType !== "equal" && expense.splitDetails && (
                        <div className="font-medium">
                          {expense.splitType === "percentage"
                            ? `${expense.splitDetails[participant.id] || 0}%`
                            : `$${(expense.splitDetails[participant.id] || 0).toFixed(2)}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            {user && expense.paidBy.id === user.id && (
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => router.push(`/expenses/${id}/edit`)}>
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
                        This action cannot be undone. This will permanently delete the expense.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            )}
          </Card>
        </div>
      ) : (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">Expense not found</h3>
          <p className="text-muted-foreground mb-6">
            The expense you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push("/expenses")}>Back to Expenses</Button>
        </div>
      )}
    </div>
  )
}

