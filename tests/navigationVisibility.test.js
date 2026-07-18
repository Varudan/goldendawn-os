import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ensureNavigationItemVisible,
  findActiveNavigationElements,
} from '../src/navigationVisibility.js'

function createFixture({
  clientWidth = 300,
  scrollWidth = 700,
  scrollLeft = 40,
  scrollTop = 0,
  navigationLeft = 10,
  navigationRight = 310,
  itemLeft = 250,
  itemRight = 340,
  supportsScrollTo = true,
} = {}) {
  const scrollCalls = []
  const navigationElement = {
    clientWidth,
    scrollWidth,
    scrollLeft,
    scrollTop,
    getBoundingClientRect() {
      return { left: navigationLeft, right: navigationRight }
    },
  }

  if (supportsScrollTo) {
    navigationElement.scrollTo = (options) => {
      scrollCalls.push(options)
      navigationElement.scrollLeft = options.left
    }
  }

  let focusCalls = 0
  const activeItem = {
    getBoundingClientRect() {
      return { left: itemLeft, right: itemRight }
    },
    focus() {
      focusCalls += 1
    },
  }

  return {
    activeItem,
    getFocusCalls: () => focusCalls,
    navigationElement,
    scrollCalls,
  }
}

test('scrollt einen rechts abgeschnittenen aktiven Eintrag nur im Navigationscontainer sichtbar', () => {
  const fixture = createFixture({ scrollTop: 7 })

  const didScroll = ensureNavigationItemVisible(
    fixture.navigationElement,
    fixture.activeItem
  )

  assert.equal(didScroll, true)
  assert.deepEqual(fixture.scrollCalls, [
    { left: 78, top: 7, behavior: 'smooth' },
  ])
  assert.equal(fixture.getFocusCalls(), 0)
})

test('scrollt bei reduzierter Bewegung ohne Animation nach links', () => {
  const fixture = createFixture({
    itemLeft: 0,
    itemRight: 90,
    scrollLeft: 50,
  })

  const didScroll = ensureNavigationItemVisible(
    fixture.navigationElement,
    fixture.activeItem,
    { prefersReducedMotion: true }
  )

  assert.equal(didScroll, true)
  assert.deepEqual(fixture.scrollCalls, [
    { left: 32, top: 0, behavior: 'auto' },
  ])
  assert.equal(fixture.getFocusCalls(), 0)
})

test('verändert vollständig sichtbare Einträge und Navigation ohne Overflow nicht', () => {
  const visibleFixture = createFixture({ itemLeft: 80, itemRight: 220 })
  const nonOverflowingFixture = createFixture({
    clientWidth: 300,
    scrollWidth: 300,
  })

  assert.equal(
    ensureNavigationItemVisible(
      visibleFixture.navigationElement,
      visibleFixture.activeItem
    ),
    false
  )
  assert.equal(
    ensureNavigationItemVisible(
      nonOverflowingFixture.navigationElement,
      nonOverflowingFixture.activeItem
    ),
    false
  )
  assert.deepEqual(visibleFixture.scrollCalls, [])
  assert.deepEqual(nonOverflowingFixture.scrollCalls, [])
  assert.equal(visibleFixture.getFocusCalls(), 0)
  assert.equal(nonOverflowingFixture.getFocusCalls(), 0)
})

test('ordnet den Hauptnavigationscontainer seinem aktiven Button zu', () => {
  const activeItem = {}
  const innerList = {}
  const navigationSelectors = []
  const rootSelectors = []
  const navigationElement = {
    querySelector(selector) {
      navigationSelectors.push(selector)
      return activeItem
    },
  }
  const rootElement = {
    querySelector(selector) {
      rootSelectors.push(selector)
      return selector === 'nav[aria-label="Hauptnavigation"]'
        ? navigationElement
        : innerList
    },
  }

  const result = findActiveNavigationElements(rootElement)

  assert.deepEqual(result, { navigationElement, activeItem })
  assert.deepEqual(rootSelectors, ['nav[aria-label="Hauptnavigation"]'])
  assert.deepEqual(navigationSelectors, [
    '.nav-button[aria-current="page"]',
  ])
  assert.notEqual(result.navigationElement, innerList)
})

test('hält bei 390 CSS-Pixeln den vollständigen Fokusrahmen sichtbar', () => {
  const fixture = createFixture({
    clientWidth: 342,
    scrollWidth: 450,
    scrollLeft: 0,
    navigationLeft: 24,
    navigationRight: 366,
    itemLeft: 360,
    itemRight: 466,
  })

  const didScroll = ensureNavigationItemVisible(
    fixture.navigationElement,
    fixture.activeItem
  )

  assert.equal(didScroll, true)
  assert.deepEqual(fixture.scrollCalls, [
    { left: 108, top: 0, behavior: 'smooth' },
  ])
  assert.ok(466 - fixture.scrollCalls[0].left + 6 <= 366)
  assert.equal(fixture.getFocusCalls(), 0)
})
