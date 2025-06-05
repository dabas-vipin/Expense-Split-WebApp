import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, DollarSign, Users, PieChart } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Split Expenses with Friends & Groups
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                SoftSplit makes it easy to track shared expenses, calculate balances, and settle up with friends,
                roommates, and groups.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/login">
                <Button>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Create Account</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Track Expenses</h3>
                <p className="text-muted-foreground">
                  Easily record shared expenses with flexible split options including equal, percentage, or exact
                  amounts.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Manage Groups</h3>
                <p className="text-muted-foreground">
                  Create groups for roommates, trips, events, or projects to keep expenses organized.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <PieChart className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Settle Balances</h3>
                <p className="text-muted-foreground">
                  See who owes what at a glance and simplify settling up with clear balance calculations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

