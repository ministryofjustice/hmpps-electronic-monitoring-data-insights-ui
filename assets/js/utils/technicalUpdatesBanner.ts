const STORAGE_KEY = 'technicalUpdatesBannerDismissedVersion'

const getBannerContext = () => {
  const banner = document.getElementById('technical-updates-banner')
  if (!banner) return null

  const currentVersion = banner.getAttribute('data-banner-version') ?? ''
  const savedVersion = localStorage.getItem(STORAGE_KEY)

  return { banner, currentVersion, savedVersion }
}

const dismissBanner = (banner: HTMLElement, version: string) => {
  const bannerEl = banner
  localStorage.setItem(STORAGE_KEY, version)
  bannerEl.style.display = 'none'
}

export const hideBannerIfAlreadySeen = (): void => {
  const ctx = getBannerContext()
  if (!ctx) return

  if (ctx.savedVersion === ctx.currentVersion) {
    ctx.banner.style.display = 'none'
  }
}

export const initialiseTechnicalUpdatesBanner = (): void => {
  const ctx = getBannerContext()
  if (!ctx) return

  if (ctx.savedVersion === ctx.currentVersion) {
    ctx.banner.style.display = 'none'
    return
  }

  localStorage.setItem(STORAGE_KEY, ctx.currentVersion)

  document.getElementById('hide-message')?.addEventListener('click', event => {
    event.preventDefault()
    dismissBanner(ctx.banner, ctx.currentVersion)
  })
}

export default initialiseTechnicalUpdatesBanner
