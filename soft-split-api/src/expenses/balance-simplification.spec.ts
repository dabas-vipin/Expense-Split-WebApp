import { greedyMinCashFlow } from './balance-simplification';

describe('greedyMinCashFlow', () => {
  it('returns no transactions when everybody is square', () => {
    const net = new Map<string, number>([
      ['alice', 0],
      ['bob', 0],
      ['charlie', 0],
    ]);
    expect(greedyMinCashFlow(net)).toEqual([]);
  });

  it('emits a single transaction for a two-person owe', () => {
    // Alice owes Bob $10.
    const net = new Map<string, number>([
      ['alice', -1000],
      ['bob', 1000],
    ]);
    expect(greedyMinCashFlow(net)).toEqual([
      { from: 'alice', to: 'bob', cents: 1000 },
    ]);
  });

  it('collapses A -> B -> C into a single A -> C transaction', () => {
    // Alice owes $10, Bob is square, Charlie is owed $10. Pairwise the natural
    // path is Alice -> Bob -> Charlie (two transactions); the optimal is one.
    const net = new Map<string, number>([
      ['alice', -1000],
      ['bob', 0],
      ['charlie', 1000],
    ]);
    const result = greedyMinCashFlow(net);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ from: 'alice', to: 'charlie', cents: 1000 });
  });

  it('splits a debtor across multiple creditors when one creditor cannot absorb the whole debt', () => {
    // Alice owes $30; Bob is owed $10; Charlie is owed $20. Optimum is 2.
    const net = new Map<string, number>([
      ['alice', -3000],
      ['bob', 1000],
      ['charlie', 2000],
    ]);
    const result = greedyMinCashFlow(net);
    // Sum of transaction amounts must equal Alice's debt.
    expect(result.reduce((s, t) => s + t.cents, 0)).toBe(3000);
    expect(result).toHaveLength(2);
    // Alice is the only debtor, so she's the sender on every edge.
    expect(result.every((tx) => tx.from === 'alice')).toBe(true);
  });

  it('does no worse than N - 1 transactions even with messy positions', () => {
    // Five-member group with asymmetric balances; optimum here is exactly 3
    // (max-debtor matched with max-creditor each round zeroes one side).
    const net = new Map<string, number>([
      ['a', -1500], // owes 15
      ['b', -500], //  owes 5
      ['c', 700], //  owed 7
      ['d', 800], //  owed 8
      ['e', 500], //  owed 5
    ]);
    const result = greedyMinCashFlow(net);
    expect(result.length).toBeLessThanOrEqual(4); // strictly < N
    // Net positions must add up to zero — every cent that left a debtor
    // must arrive at a creditor.
    const inbound: Record<string, number> = {};
    const outbound: Record<string, number> = {};
    for (const tx of result) {
      outbound[tx.from] = (outbound[tx.from] ?? 0) + tx.cents;
      inbound[tx.to] = (inbound[tx.to] ?? 0) + tx.cents;
    }
    expect(outbound.a).toBe(1500);
    expect(outbound.b).toBe(500);
    expect(inbound.c).toBe(700);
    expect(inbound.d).toBe(800);
    expect(inbound.e).toBe(500);
  });

  it('ignores zero-balance participants without emitting trivial edges', () => {
    const net = new Map<string, number>([
      ['alice', -500],
      ['bob', 0],
      ['charlie', 500],
      ['dave', 0],
    ]);
    const result = greedyMinCashFlow(net);
    expect(result).toEqual([
      { from: 'alice', to: 'charlie', cents: 500 },
    ]);
  });
});
