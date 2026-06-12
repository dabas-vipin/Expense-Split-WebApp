"use client"

import { useState } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    try {
      setSubmitting(true)
      // The backend returns 204 regardless of whether the email is associated
      // with an account, so we can't tell the user "we sent it"; we say
      // "if this is a real account, check your inbox" — which is also the
      // standard anti-enumeration UX.
      await api.post("/auth/password-reset/request", { email: email.trim() })
      setDone(true)
    } catch (err) {
      // Same outward message on errors so behaviour stays uniform.
      console.error("reset request failed", err)
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>
            Enter the email you registered with. If it matches an account,
            we'll send a reset link to it.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {done ? (
              <p className="text-sm">
                If there's an account for <span className="font-medium">{email}</span>,
                a reset link is on its way. Check your inbox (and the API server
                logs — the demo backend writes emails to stdout).
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/login" className="text-sm underline">
              Back to sign in
            </Link>
            {!done ? (
              <Button type="submit" disabled={submitting || !email.trim()}>
                {submitting ? "Sending…" : "Send reset link"}
              </Button>
            ) : null}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
