import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BalanceSummary } from './balance-summary'

describe('<BalanceSummary />', () => {
  it('shows the net total and "you are owed" when positive', () => {
    render(
      <BalanceSummary
        balances={[
          { userId: 'u1', amount: 30, user: { name: 'A' } },
          { userId: 'u2', amount: 12.5, user: { name: 'B' } },
        ]}
      />,
    )

    expect(screen.getByText(/\$42\.50/)).toBeInTheDocument()
    expect(screen.getByText(/you are owed/i)).toBeInTheDocument()
  })

  it('shows "you owe" when net is negative', () => {
    render(
      <BalanceSummary
        balances={[
          { userId: 'u1', amount: -100, user: { name: 'A' } },
        ]}
      />,
    )

    expect(screen.getByText(/-\$100\.00|\$-100\.00/)).toBeInTheDocument()
    expect(screen.getByText(/you owe/i)).toBeInTheDocument()
  })

  it('renders $0.00 with the "owed" label for an empty list', () => {
    render(<BalanceSummary balances={[]} />)

    expect(screen.getByText(/\$0\.00/)).toBeInTheDocument()
    expect(screen.getByText(/you are owed/i)).toBeInTheDocument()
  })
})
