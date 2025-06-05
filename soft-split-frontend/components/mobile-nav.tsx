"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Menu, LogOut } from "lucide-react"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
      protected: true,
    },
    {
      href: "/expenses",
      label: "Expenses",
      active: pathname === "/expenses",
      protected: true,
    },
    {
      href: "/groups",
      label: "Groups",
      active: pathname === "/groups",
      protected: true,
    },
    {
      href: "/balances",
      label: "Balances",
      active: pathname === "/balances",
      protected: true,
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex flex-col space-y-4 py-4">
          <Link href="/" className="flex items-center space-x-2" onClick={() => setOpen(false)}>
            <span className="font-bold">SoftSplit</span>
          </Link>
          <div className="flex flex-col space-y-3">
            {user ? (
              <>
                {routes
                  .filter((route) => !route.protected || user)
                  .map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        route.active ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {route.label}
                    </Link>
                  ))}
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Profile
                </Link>
                <Button
                  variant="ghost"
                  className="justify-start px-2"
                  onClick={() => {
                    logout()
                    setOpen(false)
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

