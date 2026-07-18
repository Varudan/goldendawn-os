const NAVIGATION_EDGE_GAP = 8

function isFiniteNumber(value) {
  return Number.isFinite(value)
}

export function findActiveNavigationElements(rootElement) {
  const navigationElement =
    typeof rootElement?.querySelector === 'function'
      ? rootElement.querySelector('nav[aria-label="Hauptnavigation"]')
      : null
  const activeItem =
    typeof navigationElement?.querySelector === 'function'
      ? navigationElement.querySelector('.nav-button[aria-current="page"]')
      : null

  return { navigationElement, activeItem }
}

export function ensureNavigationItemVisible(
  navigationElement,
  activeItem,
  { prefersReducedMotion = false } = {}
) {
  if (
    typeof navigationElement?.getBoundingClientRect !== 'function' ||
    typeof activeItem?.getBoundingClientRect !== 'function'
  ) {
    return false
  }

  const clientWidth = navigationElement.clientWidth
  const scrollWidth = navigationElement.scrollWidth

  if (
    !isFiniteNumber(clientWidth) ||
    !isFiniteNumber(scrollWidth) ||
    clientWidth <= 0 ||
    scrollWidth <= clientWidth
  ) {
    return false
  }

  const navigationBounds = navigationElement.getBoundingClientRect()
  const itemBounds = activeItem.getBoundingClientRect()

  if (
    !isFiniteNumber(navigationBounds.left) ||
    !isFiniteNumber(navigationBounds.right) ||
    !isFiniteNumber(itemBounds.left) ||
    !isFiniteNumber(itemBounds.right)
  ) {
    return false
  }

  const visibleLeft = navigationBounds.left + NAVIGATION_EDGE_GAP
  const visibleRight = navigationBounds.right - NAVIGATION_EDGE_GAP
  let scrollDelta = 0

  if (itemBounds.left < visibleLeft) {
    scrollDelta = itemBounds.left - visibleLeft
  } else if (itemBounds.right > visibleRight) {
    scrollDelta = itemBounds.right - visibleRight
  } else {
    return false
  }

  const currentScrollLeft = isFiniteNumber(navigationElement.scrollLeft)
    ? navigationElement.scrollLeft
    : 0
  const maximumScrollLeft = Math.max(0, scrollWidth - clientWidth)
  const targetScrollLeft = Math.min(
    maximumScrollLeft,
    Math.max(0, currentScrollLeft + scrollDelta)
  )

  if (targetScrollLeft === currentScrollLeft) {
    return false
  }

  if (typeof navigationElement.scrollTo === 'function') {
    navigationElement.scrollTo({
      left: targetScrollLeft,
      top: isFiniteNumber(navigationElement.scrollTop)
        ? navigationElement.scrollTop
        : 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  } else {
    navigationElement.scrollLeft = targetScrollLeft
  }

  return true
}
