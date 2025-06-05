"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function MainNav() {
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
    {
      href: "/friends",
      label: "Friends",
      active: pathname === "/friends",
      protected: true,
    },
  ]

  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="flex items-center space-x-2">
        <span className="font-bold inline-block">SoftSplit</span>
      </Link>
      {user ? (
        <>
          <nav className="hidden md:flex gap-6">
            {routes
              .filter((route) => !route.protected || user)
              .map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    route.active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {route.label}
                </Link>
              ))}
          </nav>
          <div className="hidden md:flex ml-auto items-center gap-2">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                {user.name}
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="hidden md:flex ml-auto gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Register</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

