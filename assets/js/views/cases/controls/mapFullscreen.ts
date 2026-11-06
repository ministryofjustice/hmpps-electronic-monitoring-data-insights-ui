export default function initialiseMapFullscreen(
  button: HTMLButtonElement,
  mapContainer: HTMLElement,
  updateSize: () => void,
): () => void {
  const workspace = mapContainer.closest<HTMLElement>('[data-map-workspace]')
  const sidebar = workspace?.querySelector<HTMLElement>('[data-map-sidebar]')
  if (!workspace || !sidebar) throw new Error('Map fullscreen requires a workspace and sidebar')

  const details = document.querySelector<HTMLElement>('[data-qa="cases-header"]')
  const name = document.querySelector<HTMLElement>('[data-map-person-name]')
  const notices = document.querySelectorAll<HTMLElement>(
    '[data-qa="location-data-error"], [data-qa="data-freshness-error"], .error-data-delay-inset',
  )
  const movedElements: Array<{ element: HTMLElement; placeholder: Comment }> = []
  const backgroundElements: Element[] = []
  let expanded = false
  let scrollPosition = { x: 0, y: 0 }

  const updateLayout = () => {
    if (expanded) {
      const navigation = document.querySelector<HTMLElement>('[data-qa="primary-navigation"]')
      const header = navigation ?? document.querySelector<HTMLElement>('header')
      const top = Math.max(0, header?.getBoundingClientRect().bottom ?? 0)
      workspace.style.setProperty('--map-workspace-top', `${top}px`)
    }
    updateSize()
  }

  const exitBrowserFullscreen = () => {
    const { exitFullscreen } = document
    if (document.fullscreenElement && exitFullscreen) {
      exitFullscreen.call(document).catch(() => {})
    }
  }

  const setExpanded = (next: boolean, focus = true) => {
    if (next === expanded) return
    expanded = next
    if (expanded) {
      scrollPosition = { x: window.scrollX, y: window.scrollY }
      window.scrollTo(0, 0)
      ;[name, details, ...notices].forEach(element => {
        if (!element) return
        const placeholder = document.createComment('Map person details')
        element.replaceWith(placeholder)
        movedElements.push({ element, placeholder })
        sidebar.insertBefore(element, sidebar.querySelector('[data-map-search]'))
      })
      sidebar.querySelectorAll<HTMLElement>('.map-search__time').forEach(element => {
        const periods = element.closest('.map-search__periods')
        if (!periods) return
        const placeholder = document.createComment('Map search time')
        element.replaceWith(placeholder)
        movedElements.push({ element, placeholder })
        periods.appendChild(element)
      })
      const main = workspace.closest('main')
      let branch: Element = workspace
      while (main && branch !== main) {
        const parent = branch.parentElement!
        for (const sibling of Array.from(parent.children)) {
          if (sibling !== branch && !sibling.hasAttribute('inert')) backgroundElements.push(sibling)
        }
        branch = parent
      }
      document.querySelectorAll('footer:not([inert])').forEach(footer => backgroundElements.push(footer))
      backgroundElements.forEach(element => element.setAttribute('inert', ''))
    } else {
      movedElements.forEach(({ element, placeholder }) => placeholder.replaceWith(element))
      movedElements.length = 0
      backgroundElements.forEach(element => element.removeAttribute('inert'))
      backgroundElements.length = 0
      workspace.style.removeProperty('--map-workspace-top')
    }

    workspace.classList.toggle('map-workspace--expanded', expanded)
    document.documentElement.classList.toggle('emdi-map-expanded', expanded)
    const label = expanded ? 'Exit full screen map' : 'Full screen map'
    button.setAttribute('aria-label', label)
    button.setAttribute('title', label)
    button.setAttribute('aria-expanded', String(expanded))
    if (!expanded) window.scrollTo(scrollPosition.x, scrollPosition.y)
    updateLayout()
    if (focus) button.focus()
  }

  button.setAttribute('aria-expanded', 'false')
  const toggle = () => {
    if (expanded) {
      exitBrowserFullscreen()
      setExpanded(false)
      return
    }

    const root = document.documentElement
    let request: Promise<void> | undefined
    try {
      request = root.requestFullscreen?.({ navigationUI: 'hide' })
    } catch {
      request = undefined
    }
    setExpanded(true)
    request?.catch(() => {})
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && expanded && !document.fullscreenElement && !event.defaultPrevented) {
      event.preventDefault()
      setExpanded(false)
    }
  }
  const onFullscreenChange = () => {
    if (expanded && document.fullscreenElement !== document.documentElement) setExpanded(false)
  }
  button.addEventListener('click', toggle)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  window.addEventListener('resize', updateLayout)
  const observer = new ResizeObserver(updateLayout)
  document
    .querySelectorAll('header, [data-qa="primary-navigation"], [aria-label="Service information"]')
    .forEach(element => observer.observe(element))

  return () => {
    button.removeEventListener('click', toggle)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    window.removeEventListener('resize', updateLayout)
    observer.disconnect()
    exitBrowserFullscreen()
    setExpanded(false, false)
  }
}
