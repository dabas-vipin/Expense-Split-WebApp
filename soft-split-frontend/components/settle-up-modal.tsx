"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"

interface SettleUpModalProps {
  /** UUID of the user being paid (the creditor). */
  payeeId: string
  /** Display name for the payee. */
  payeeName: string
  /** What the current user currently owes the payee (positive number). */
  outstanding: number
  /** Optional override for the trigger button label. */
  triggerLabel?: string
  /** Optional className for the trigger button. */
  triggerClassName?: string
  /** Called after a successful settlement is recorded. */
  onSettled?: () => void
}

export function SettleUpModal({
  payeeId,
  payeeName,
  outstanding,
  triggerLabel = "Settle up",
  triggerClassName,
  onSettled,
}: SettleUpModalProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<string>(outstanding.toFixed(2))
  const [note, setNote] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setAmount(outstanding.toFixed(2))
    setNote("")
    setSubmitting(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const numericAmount = Number.parseFloat(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a positive number.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      await api.post("/settlements", {
        payeeId,
        amount: numericAmount,
        note: note.trim() ? note.trim() : undefined,
      })
      toast({
        title: "Settled",
        description: `Recorded $${numericAmount.toFixed(2)} paid to ${payeeName}.`,
      })
      setOpen(false)
      reset()
      onSettled?.()
    } catch (error) {
      // The API interceptor in lib/api already toasts on 401/403/422/network,
      // so we only need to handle the "unspecified failure" case here.
      console.error("settlement failed", error)
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
        <Button size="sm" className={triggerClassName}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Settle up with {payeeName}</DialogTitle>
            <DialogDescription>
              You currently owe {payeeName} ${outstanding.toFixed(2)}. Partial
              settlements are allowed — adjust the amount below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="settle-amount">Amount (USD)</Label>
              <Input
                id="settle-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="settle-note">Note (optional)</Label>
              <Textarea
                id="settle-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Venmo, cash, splitwise, ..."
                maxLength={280}
              />
            </div>
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
            <Button type="submit" disabled={submitting}>
              {submitting ? "Recording…" : "Record settlement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
