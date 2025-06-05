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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { User } from "@/src/contracts"

export default function NewGroupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [members, setMembers] = useState<string[]>([])
  const [friends, setFriends] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true)
        const response = await api.get("/users/friends/list")
        setFriends(response.data)
        // Add current user as member by default
        if (user) {
          setMembers([user.id])
        }
      } catch (error) {
        console.error("Error fetching friends:", error)
        toast({
          title: "Error",
          description: "Failed to load friends list",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFriends()
  }, [user, toast])

  const handleMemberToggle = (userId: string) => {
    setMembers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || members.length < 2) {
      toast({
        title: "Missing fields",
        description: "Please provide a group name and select at least one friend",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const groupData = {
        name,
        description,
        memberIds: members,
      }

      await api.post("/groups", groupData)

      toast({
        title: "Success",
        description: "Group created successfully",
      })

      router.push("/groups")
    } catch (error) {
      console.error("Error creating group:", error)
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      })
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
            <CardTitle>Create New Group</CardTitle>
            <CardDescription>Create a group to track expenses with friends</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  placeholder="Roommates, Trip to Paris, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What is this group for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Members</Label>
                <div className="border rounded-md p-4 space-y-2">
                  {loading ? (
                    <div className="text-center py-2">Loading friends...</div>
                  ) : friends.length === 0 ? (
                    <div className="text-center py-2 text-muted-foreground">
                      No friends found. Add some friends first!
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <div key={friend.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`friend-${friend.id}`}
                          checked={members.includes(friend.id)}
                          onCheckedChange={() => handleMemberToggle(friend.id)}
                          disabled={friend.id === user?.id} // Disable checkbox for current user
                        />
                        <Label 
                          htmlFor={`friend-${friend.id}`} 
                          className={`cursor-pointer ${friend.id === user?.id ? 'text-muted-foreground' : ''}`}
                        >
                          {friend.name} {friend.id === user?.id && '(You)'}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !name || members.length < 2}
              >
                {isSubmitting ? "Creating..." : "Create Group"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

