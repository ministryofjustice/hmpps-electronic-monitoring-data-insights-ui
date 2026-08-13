declare module '@ministryofjustice/frontend/moj/filters/all' {
  const filters: () => Record<string, (...args: unknown[]) => unknown>
  export default filters
}
