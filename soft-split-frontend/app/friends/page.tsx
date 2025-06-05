"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Search, UserPlus, UserCheck, UserX } from "lucide-react"
import { Friend, FriendRequest, User } from "@/src/contracts"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export default function FriendsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchEmail, setSearchEmail] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchFriends()
      fetchPendingRequests()
    }
  }, [user])

  const fetchFriends = async () => {
    try {
      const response = await api.get("/users/friends/list")
      setFriends(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Error fetching friends:", error)
      toast({
        title: "Error",
        description: "Failed to fetch friends list",
        variant: "destructive",
      })
      setFriends([])
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get("/users/friends/requests/pending")
      if (response.data) {
        console.log('Pending requests:', response.data)
        setReceivedRequests(response.data.receivedRequests || [])
        setSentRequests(response.data.sentRequests || [])
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error)
      toast({
        title: "Error",
        description: "Failed to fetch friend requests",
        variant: "destructive",
      })
      setReceivedRequests([])
      setSentRequests([])
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchEmail.trim()) return

    try {
      setLoading(true)
      const response = await api.get(`/users/search?email=${searchEmail}`)
      console.log('Search response:', response.data)
      setSearchResults(response.data ? [response.data] : [])
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      })
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (email: string) => {
    try {
      console.log('User to add:', email)
      
      if (!email) {
        throw new Error('User email is missing')
      }

      const response = await api.post("/users/friends/request", {
        receiverEmail: email
      })
      
      console.log('Friend request response:', response.data)
      
      toast({
        title: "Success",
        description: "Friend request sent successfully",
      })
      setSearchResults([])
      setSearchEmail("")
      await fetchPendingRequests()
    } catch (error) {
      console.error('Friend request error:', error)
      toast({
        title: "Error",
        description: (error as any).response?.data?.message || "Failed to send friend request",
        variant: "destructive",
      })
    }
  }

  const handleRequest = async (requestId: string, accept: boolean) => {
    try {
      await api.post(`/users/friends/request/${requestId}`, { accept })
      toast({
        title: "Success",
        description: accept ? "Friend request accepted" : "Friend request rejected",
      })
      fetchPendingRequests()
      if (accept) fetchFriends()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process friend request",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Friends</h1>
      
      <Tabs defaultValue="friends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="friends">My Friends</TabsTrigger>
          <TabsTrigger value="requests">Pending Requests</TabsTrigger>
          <TabsTrigger value="add">Add Friend</TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <div className="grid gap-4">
            {friends.map((friend: Friend) => (
              <Card key={friend.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <UserCheck className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-muted-foreground">{friend.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <div className="grid gap-4">
            {[...receivedRequests].map((request) => (
              <Card key={request.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{request.sender.name}</p>
                    <p className="text-sm text-muted-foreground">{request.sender.email}</p>
                  </div>
                  <div className="space-x-2">
                    <Button onClick={() => handleRequest(request.id, true)} size="sm">
                      Accept
                    </Button>
                    <Button onClick={() => handleRequest(request.id, false)} variant="outline" size="sm">
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {[...sentRequests].map((request) => (
              <Card key={request.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{request.receiver.name}</p>
                    <p className="text-sm text-muted-foreground">{request.receiver.email}</p>
                    <p className="text-sm text-muted-foreground">(Request Sent)</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Friend</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <Button type="submit" disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              <div className="mt-4 space-y-4">
                {searchResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg mb-2">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={result.avatar || ''} />
                        <AvatarFallback>{result.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{result.name}</p>
                        <p className="text-sm text-gray-500">{result.email}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => sendFriendRequest(result.email)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 