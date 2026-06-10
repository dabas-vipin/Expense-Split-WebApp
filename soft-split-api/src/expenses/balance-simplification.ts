/**
 * Pure debt-simplification math, kept separate from ExpensesService so it can
 * be unit-tested without dragging in TypeORM, NestJS providers, or DB shape.
 *
 * Net positions are integers in cents (positive = creditor, negative = debtor).
 * The greedy algorithm repeatedly pairs the max-debtor with the max-creditor
 * and emits one transaction; their balances move toward zero until nobody is
 * owed or owes anything. It produces an optimal transaction count when the
 * net positions are independent of grouping structure, which is the case here
 * — see "minimum cash flow" / "splitwise simplify".
 *
 * O(N^2) on the number of non-zero participants. Realistic groups are < 30
 * members, so the trade-off vs. a heap-based variant is negligible.
 */
export interface SimplifiedTransaction {
  from: string;
  to: string;
  cents: number;
}

export function greedyMinCashFlow(
  netCents: Map<string, number>,
): SimplifiedTransaction[] {
  type Node = { id: string; cents: number };
  const ledger: Node[] = [...netCents.entries()]
    .map(([id, cents]) => ({ id, cents }))
    .filter((node) => node.cents !== 0);

  const transactions: SimplifiedTransaction[] = [];

  while (ledger.length > 0) {
    ledger.sort((a, b) => a.cents - b.cents);
    const debtor = ledger[0];
    const creditor = ledger[ledger.length - 1];

    // No more pairs to settle (one side has been exhausted).
    if (debtor.cents >= 0 || creditor.cents <= 0) break;

    const amount = Math.min(-debtor.cents, creditor.cents);
    transactions.push({ from: debtor.id, to: creditor.id, cents: amount });
    debtor.cents += amount;
    creditor.cents -= amount;

    if (debtor.cents === 0) ledger.shift();
    if (ledger.length && ledger[ledger.length - 1].cents === 0) ledger.pop();
  }

  return transactions;
}
