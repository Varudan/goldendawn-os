function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }

  return value
}

export const LEARNING_HUB_DEMO = deepFreeze({
  schemaVersion: 2,
  dataOrigin: 'synthetic',
  modules: [
    {
      id: 'demo-module-clear-thinking',
      title: 'Werkstatt für klare Gedanken',
      position: 1,
      chapters: [
        {
          id: 'demo-chapter-small-observations',
          title: 'Kleine Beobachtungen',
          position: 1,
          learningNodes: [
            {
              id: 'demo-node-notice-patterns',
              title: 'Muster bemerken',
              content: 'Notiere drei frei erfundene Muster und beschreibe ihre Unterschiede.',
              position: 1,
            },
            {
              id: 'demo-node-change-perspective',
              title: 'Blickwinkel wechseln',
              content: 'Formuliere dieselbe neutrale Beobachtung aus zwei Perspektiven.',
              position: 2,
            },
          ],
        },
      ],
    },
    {
      id: 'demo-module-calm-routines',
      title: 'Atelier für ruhige Routinen',
      position: 2,
      chapters: [
        {
          id: 'demo-chapter-open-space',
          title: 'Freier Platz für eine neue Karte',
          position: 1,
          learningNodes: [],
        },
      ],
    },
  ],
})
