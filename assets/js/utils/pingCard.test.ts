import { getNavVisibilityState, resolveNavTargetIndex } from './pingCard'

describe('getNavVisibilityState', () => {
  it('hides first and prev on the first point', () => {
    expect(getNavVisibilityState(0, 77)).toEqual({
      first: 'hidden',
      prev: 'hidden',
      next: 'visible',
      last: 'visible',
    })
  })

  it('hides next and last on the final point', () => {
    expect(getNavVisibilityState(76, 77)).toEqual({
      first: 'visible',
      prev: 'visible',
      next: 'hidden',
      last: 'hidden',
    })
  })

  it('shows all four controls for a middle point', () => {
    expect(getNavVisibilityState(38, 77)).toEqual({
      first: 'visible',
      prev: 'visible',
      next: 'visible',
      last: 'visible',
    })
  })

  it('hides everything when there is only a single position', () => {
    expect(getNavVisibilityState(0, 1)).toEqual({
      first: 'hidden',
      prev: 'hidden',
      next: 'hidden',
      last: 'hidden',
    })
  })
})

describe('resolveNavTargetIndex', () => {
  const total = 77

  it('returns null when there is no current index', () => {
    expect(resolveNavTargetIndex('next', null, total)).toBeNull()
  })

  it('moves to the previous index on "prev"', () => {
    expect(resolveNavTargetIndex('prev', 10, total)).toBe(9)
  })

  it('does not move before the first index on "prev"', () => {
    expect(resolveNavTargetIndex('prev', 0, total)).toBeNull()
  })

  it('moves to the next index on "next"', () => {
    expect(resolveNavTargetIndex('next', 10, total)).toBe(11)
  })

  it('does not move past the last index on "next"', () => {
    expect(resolveNavTargetIndex('next', total - 1, total)).toBeNull()
  })

  it('jumps to index 0 on "first" regardless of current index', () => {
    expect(resolveNavTargetIndex('first', 40, total)).toBe(0)
  })

  it('jumps to the last index on "last" regardless of current index', () => {
    expect(resolveNavTargetIndex('last', 5, total)).toBe(total - 1)
  })

  it('returns null for an unrecognised direction', () => {
    expect(resolveNavTargetIndex('sideways', 10, total)).toBeNull()
  })
})
