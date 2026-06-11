"use client"

import { useState } from "react"
import axios from "axios"
import { api } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"

interface InviteToGroupModalProps {
  groupId: string
  groupName: string
  /** Optional override for the trigger label. */
  triggerLabel?: string
  /** Called after a successful invitation. */
  onInvited?: () => void
}

export function InviteToGroupModal({
  groupId,
  groupName,
  triggerLabel = "Invite",
  onInvited,
}: InviteToGroupModalProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setEmail("")
    setSubmitting(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return

    try {
      setSubmitting(true)
      await api.post(`/groups/${groupId}/invitations`, {
        email: email.trim(),
      })
      toast({
        title: "Invitation sent",
        description: `${email.trim()} can accept it from their Friends page.`,
      })
      setOpen(false)
      reset()
      onInvited?.()
    } catch (error) {
      // The shared axios interceptor handles 401/403/422/network. Surface a
      // friendlier message for the common 4xx specifically thrown here
      // (no such user, already a member, already invited).
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        toast({
          title: "Can't send invitation",
          description: error.response.data?.message ?? "Invalid request.",
          variant: "destructive",
        })
      } else if (
        axios.isAxiosError(error) &&
        error.response?.status === 404
      ) {
        toast({
          title: "No Soft Split user with that email",
          description: "Ask them to sign up first, then invite them again.",
          variant: "destructive",
        })
      }
      console.error("invitation failed", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite to {groupName}</DialogTitle>
            <DialogDescription>
              The recipient does not need to be your friend. They'll see a
              pending invitation on their Friends page and can accept or
              reject it.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-4">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !email.trim()}>
              {submitting ? "Sending…" : "Send invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
