import { useMemo } from "react"

interface Balance {
  userId: string
  amount: number
  user: {
    name: string
  }
}

interface BalanceSummaryProps {
  balances: Balance[]
}

export function BalanceSummary({ balances }: BalanceSummaryProps) {
  const totalBalance = useMemo(() => {
    return balances.reduce((sum, balance) => sum + balance.amount, 0)
  }, [balances])

  return (
    <div className="text-2xl font-bold">
      ${totalBalance.toFixed(2)}
      <span className={`text-sm ml-1 ${totalBalance >= 0 ? "text-green-500" : "text-red-500"}`}>
        {totalBalance >= 0 ? "you are owed" : "you owe"}
      </span>
    </div>
  )
}

