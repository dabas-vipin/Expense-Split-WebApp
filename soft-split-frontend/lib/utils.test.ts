import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('drops falsy values', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c')
  })

  it('honours conditional objects (clsx semantics)', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })

  it('deduplicates conflicting Tailwind utilities (twMerge wins)', () => {
    // tailwind-merge keeps the later utility when two of the same axis collide.
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })
})
