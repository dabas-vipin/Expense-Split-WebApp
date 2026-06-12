import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface ExpenseCardProps {
  expense: {
    id: string
    description: string
    amount: number
    date: string
    paidBy: {
      id: string
      name: string
      avatar?: string
    }
    group?: {
      id: string
      name: string
    }
    splitType: string
    // Optional so older callers keep type-checking; runtime falls back
    // sensibly when these aren't present.
    category?: string
    currency?: string
  }
}

// Minimal currency formatter. Falls back to the raw code as a prefix when
// Intl doesn't know the currency, so cosmetic typos don't crash the UI.
function formatMoney(amount: number, currency: string | undefined): string {
  const code = (currency || "USD").toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).format(amount)
  } catch {
    return `${code} ${amount.toFixed(2)}`
  }
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  return (
    <Link href={`/expenses/${expense.id}`}>
      <Card className="hover:bg-accent/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={expense.paidBy.avatar || "/placeholder.svg?height=36&width=36"}
                  alt={expense.paidBy.name}
                />
                <AvatarFallback>{expense.paidBy.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{expense.description}</div>
                <div className="text-sm text-muted-foreground">
                  Paid by {expense.paidBy.name} • {formatDistanceToNow(new Date(expense.date), { addSuffix: true })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">
                {formatMoney(expense.amount, expense.currency)}
              </div>
              <div className="flex flex-wrap gap-2 justify-end mt-1">
                {expense.group && (
                  <Badge variant="outline" className="text-xs">
                    {expense.group.name}
                  </Badge>
                )}
                {expense.category && expense.category !== "other" ? (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {expense.category}
                  </Badge>
                ) : null}
                <Badge variant="secondary" className="text-xs capitalize">
                  {expense.splitType}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

