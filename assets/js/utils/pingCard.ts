export const getNavVisibilityState = (index: number, totalPositions: number) =>
  ({
    first: index === 0 ? 'hidden' : 'visible',
    prev: index === 0 ? 'hidden' : 'visible',
    next: index === totalPositions - 1 ? 'hidden' : 'visible',
    last: index === totalPositions - 1 ? 'hidden' : 'visible',
  }) as const

export const resolveNavTargetIndex = (
  direction: string | undefined,
  currentIndex: number | null,
  totalPositions: number,
): number | null => {
  if (currentIndex === null) return null
  if (direction === 'prev' && currentIndex > 0) return currentIndex - 1
  if (direction === 'next' && currentIndex < totalPositions - 1) return currentIndex + 1
  if (direction === 'first') return 0
  if (direction === 'last') return totalPositions - 1
  return null
}
