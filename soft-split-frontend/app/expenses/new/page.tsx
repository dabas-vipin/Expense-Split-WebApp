"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Group } from "@/src/contracts"

export default function NewExpensePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<Date>(new Date())
  const [splitType, setSplitType] = useState("equal")
  const [groupId, setGroupId] = useState("")
  const [participants, setParticipants] = useState<string[]>([])
  const [splitDetails, setSplitDetails] = useState<Record<string, number>>({})

  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch groups
        const groupsResponse = await api.get("/groups/user")
        setGroups(groupsResponse.data)

        // Fetch users
        const usersResponse = await api.get("/users/friends/list")
        setUsers(usersResponse.data)

        // Set current user as participant by default
        if (user) {
          setParticipants([user.id])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, toast])

  const handleGroupChange = async (value: string) => {
    setGroupId(value)
    setParticipants([]) // Clear participants when group changes

    if (value && value !== "no_group") {
      try {
        // Fetch group members
        const groupResponse = await api.get(`/groups/${value}`)
        const members = groupResponse.data.members
        
        // Set current user as participant by default
        if (user) {
          setParticipants([user.id])
        }
        
        // Update users list with group members
        setUsers(members)
      } catch (error) {
        console.error("Error fetching group members:", error)
        toast({
          title: "Error",
          description: "Failed to load group members",
          variant: "destructive",
        })
      }
    } else {
      // Reset to all friends when no group is selected
      try {
        const usersResponse = await api.get("/users/friends/list")
        setUsers(usersResponse.data)
        if (user) {
          setParticipants([user.id])
        }
      } catch (error) {
        console.error("Error fetching friends:", error)
      }
    }
  }

  const handleParticipantToggle = (userId: string) => {
    setParticipants((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleSplitDetailChange = (userId: string, value: string) => {
    setSplitDetails((prev) => ({
      ...prev,
      [userId]: Number.parseFloat(value) || 0,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description || !amount || participants.length === 0) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare split details based on split type
      let finalSplitDetails = {}

      if (splitType === "percentage" || splitType === "exact") {
        finalSplitDetails = splitDetails
      }

      const expenseData = {
        description,
        amount: Number.parseFloat(amount),
        date: date.toISOString(),
        paidById: user?.id,
        participantIds: participants,
        groupId: groupId === "no_group" ? null : groupId,
        splitType,
        splitDetails: finalSplitDetails,
      }

      await api.post("/expenses", expenseData)

      toast({
        title: "Success",
        description: "Expense created successfully",
      })

      router.push("/expenses")
    } catch (error: any) {
      console.error("Error creating expense:", error)
      
      if (error.response?.data?.message === 'Selected participants are not part of the group') {
        toast({
          title: "Invalid Participants",
          description: "One or more selected participants are not members of the group. Please select only group members.",
          variant: "destructive",
        })
      } else if (error.response?.data?.message === 'The payer must be a member of the group') {
        toast({
          title: "Invalid Payer",
          description: "You must be a member of the group to create an expense in it",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to create expense",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Expense</CardTitle>
            <CardDescription>Add a new expense to track and split with others</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Dinner, Groceries, Rent, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group">Group (Optional)</Label>
                <Select value={groupId} onValueChange={handleGroupChange}>
                  <SelectTrigger id="group">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_group">No Group</SelectItem>
                    {groups.map((group: Group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="splitType">Split Type</Label>
                <Select value={splitType} onValueChange={setSplitType}>
                  <SelectTrigger id="splitType">
                    <SelectValue placeholder="How to split the expense" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Equal Split</SelectItem>
                    <SelectItem value="percentage">Percentage Split</SelectItem>
                    <SelectItem value="exact">Exact Amounts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Participants</Label>
                <div className="border rounded-md p-4 space-y-2">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={participants.includes(user.id)}
                          onCheckedChange={() => handleParticipantToggle(user.id)}
                        />
                        <Label htmlFor={`user-${user.id}`} className="cursor-pointer">
                          {user.name}
                        </Label>
                      </div>

                      {participants.includes(user.id) && splitType !== "equal" && (
                        <Input
                          type="number"
                          step={splitType === "percentage" ? "1" : "0.01"}
                          min="0"
                          placeholder={splitType === "percentage" ? "%" : "$"}
                          className="w-24"
                          value={splitDetails[user.id] || ""}
                          onChange={(e) => handleSplitDetailChange(user.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" placeholder="Add any additional details about this expense" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Expense"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

