declare module 'govuk-frontend' {
  interface ErrorCallback {
    onError: (error: Error) => void
  }

  function initAll(config?: { onError?: ErrorCallback; scope?: HTMLElement } & Record<string, object>): void
}
