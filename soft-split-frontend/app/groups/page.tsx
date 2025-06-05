"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { GroupCard } from "@/components/group-card"
import { Plus, Search } from "lucide-react"
import { Group } from "@/src/contracts"

export default function GroupsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true)
        const response = await api.get('/groups')
        setGroups(response.data || [])
      } catch (error) {
        console.error("Error fetching groups:", error)
        setGroups([])
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [user])

  // Add loading state check
  if (loading) {
    return <div>Loading...</div>
  }

  const filteredGroups = groups?.filter((group: Group) => 
    group?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!user) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Please login to view your groups</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">Manage your expense groups</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/groups/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search groups..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group: Group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">No groups found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? "No groups match your search" : "Create your first group to get started"}
          </p>
          {!searchTerm && (
            <Link href="/groups/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

