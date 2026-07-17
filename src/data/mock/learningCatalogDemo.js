function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }

  return value
}

export const LEARNING_CATALOG_DEMO = deepFreeze({
  schemaVersion: 1,
  dataOrigin: 'synthetic',
  course: {
    id: 'demo-course-orientation',
    title: 'Demo-Kurs: Ruhige Orientierung',
    modules: [
      {
        id: 'demo-module-foundations',
        title: 'Demo-Modul: Neutrale Grundlagen',
        position: 1,
        units: [
          {
            id: 'demo-unit-first-steps',
            title: 'Demo-Unit: Erste Schritte',
            position: 1,
            learningNodes: [
              {
                id: 'demo-chapter-overview',
                nodeType: 'chapter',
                title: 'Demo-Kapitel: Überblick',
                position: 1,
                parentId: null,
                isTrackable: true,
              },
              {
                id: 'demo-section-example',
                nodeType: 'section',
                title: 'Demo-Abschnitt: Beispielweg',
                position: 1,
                parentId: 'demo-chapter-overview',
                isTrackable: false,
              },
              {
                id: 'demo-subsection-detail',
                nodeType: 'subsection',
                title: 'Demo-Unterabschnitt: Kleines Detail',
                position: 1,
                parentId: 'demo-section-example',
                isTrackable: false,
              },
            ],
          },
        ],
      },
    ],
  },
})
