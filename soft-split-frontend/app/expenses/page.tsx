"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ExpenseCard } from "@/components/expense-card"
import { Plus, Search, Filter } from "lucide-react"
import { Group, Expense } from "@/src/contracts"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Define a local interface for the selected expense with number amount
interface SelectedExpense extends Omit<Expense, 'amount'> {
  amount: number;
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGroup, setFilterGroup] = useState("all")
  const [groups, setGroups] = useState<Group[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedExpense, setSelectedExpense] = useState<SelectedExpense | null>(null)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true)
        if (!user) return

        // Fetch user groups for filter
        const groupsResponse = await api.get('/groups')
        setGroups(Array.isArray(groupsResponse.data) ? groupsResponse.data : [])

        // Fetch expenses with filters
        const params: Record<string, string | number> = { 
          page, 
          limit: 10
        }
        
        if (searchTerm) {
          params.search = searchTerm
        }

        if (filterGroup && filterGroup !== "all") {
          params.groupId = filterGroup
        }

        const expensesResponse = await api.get("/expenses/user", { params })
        setExpenses(expensesResponse.data?.data || [])
        setTotalPages(Math.ceil((expensesResponse.data?.total || 0) / 10))
      } catch (error) {
        console.error("Error fetching expenses:", error)
        setExpenses([])
        setGroups([])
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchExpenses()
    }
  }, [user, page, searchTerm, filterGroup])

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense({
      ...expense,
      amount: parseFloat(expense.amount)
    } as SelectedExpense)
    setShowExpenseDialog(true)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset to first page on new search
  }

  if (!user) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Please login to view your expenses</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Manage and track your shared expenses</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/expenses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search expenses..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </form>
        <div className="w-full md:w-[200px]">
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Expenses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expenses</SelectItem>
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
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : expenses.length > 0 ? (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} onClick={() => handleExpenseClick(expense)} className="cursor-pointer">
              <ExpenseCard expense={{
                ...expense,
                amount: parseFloat(expense.amount)
              }} />
            </div>
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
          <Link href="/expenses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </Link>
        </div>
      )}

      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent title="Expense Details">
          {selectedExpense && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Description</h4>
                <p>{selectedExpense.description}</p>
              </div>
              <div>
                <h4 className="font-medium">Amount</h4>
                <p>${selectedExpense.amount}</p>
              </div>
              <div>
                <h4 className="font-medium">Paid By</h4>
                <p>{selectedExpense.paidBy.name}</p>
              </div>
              <div>
                <h4 className="font-medium">Split Type</h4>
                <p className="capitalize">{selectedExpense.splitType}</p>
              </div>
              {selectedExpense.group && (
                <div>
                  <h4 className="font-medium">Group</h4>
                  <p>{selectedExpense.group.name}</p>
                </div>
              )}
              <div>
                <h4 className="font-medium">Participants</h4>
                <ul className="list-disc list-inside">
                  {selectedExpense.participants.map(participant => (
                    <li key={participant.id}>
                      {participant.name}
                      {selectedExpense.splitType !== 'equal' && selectedExpense.splitDetails[participant.id] && (
                        <span className="text-muted-foreground ml-2">
                          ({selectedExpense.splitType === 'percentage' ? '%' : '$'}
                          {selectedExpense.splitDetails[participant.id]})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Date</h4>
                <p>{new Date(selectedExpense.date).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

