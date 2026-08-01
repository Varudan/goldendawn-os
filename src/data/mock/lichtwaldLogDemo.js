function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Reflect.ownKeys(value).forEach((propertyName) => {
      deepFreeze(value[propertyName])
    })
    Object.freeze(value)
  }

  return value
}

const CANONICAL_LICHTWALD_LOG_DEMO = deepFreeze({
  schemaVersion: 1,
  dataOrigin: 'synthetic',
  featuredEntryId: 'lichtwald-demo-entry-aether-prisma',
  entries: [
    {
      id: 'lichtwald-demo-entry-aether-prisma',
      calendarDate: '2034-05-20',
      title: '[Demo] Ätherprisma im Wolkenarchiv',
      text: 'Im vollständig erfundenen Wolkenarchiv leuchtet ein violettes Papierprisma neben einem schwebenden Kartenregal.',
      tags: ['Äther', 'Wald', 'Erfunden'],
    },
    {
      id: 'lichtwald-demo-entry-mondglas-wegweiser',
      calendarDate: '2034-05-20',
      title: '[Demo] Wegweiser aus Mondglas',
      text: 'Ein fiktiver Wegweiser aus Mondglas markiert den Eingang zu einem lautlos wandernden Laternenmarkt.',
      tags: ['Waldweg', 'Mondglas', 'Erfunden'],
    },
    {
      id: 'lichtwald-demo-entry-sternenbluete',
      calendarDate: '2034-06-03',
      title: '[Demo] Mechanische Sternenblüte',
      text: 'Eine frei erfundene Sternenblüte öffnet fünf kupferne Blätter und projiziert geometrische Lichtmuster.',
      tags: ['Klanggarten', 'Wald', 'Erfunden'],
    },
    {
      id: 'lichtwald-demo-entry-klangpost',
      calendarDate: '2034-07-14',
      title: '[Demo] Klangpost aus dem Nordlichtlabor',
      text: 'Im fiktiven Nordlichtlabor sortiert eine kleine Messingmaschine farbige Klangkarten nach ihrer Form.',
      tags: ['Nordlicht', 'Klangkarte', 'Erfunden'],
    },
    {
      id: 'lichtwald-demo-entry-wolkenhafen',
      calendarDate: '2035-01-09',
      title: '[Demo] Miniaturhafen über den Wolken',
      text: 'Der vollständig erfundene Miniaturhafen empfängt Papierboote, die zwischen silbernen Wolkeninseln reisen.',
      tags: ['Wolkenhafen', 'Papierboot', 'Erfunden'],
    },
  ],
})

function cloneDemoEntry(entry) {
  return {
    id: entry.id,
    calendarDate: entry.calendarDate,
    title: entry.title,
    text: entry.text,
    tags: [...entry.tags],
  }
}

export function createLichtwaldLogDemoSnapshot() {
  return {
    schemaVersion: CANONICAL_LICHTWALD_LOG_DEMO.schemaVersion,
    dataOrigin: CANONICAL_LICHTWALD_LOG_DEMO.dataOrigin,
    featuredEntryId: CANONICAL_LICHTWALD_LOG_DEMO.featuredEntryId,
    entries: CANONICAL_LICHTWALD_LOG_DEMO.entries.map(cloneDemoEntry),
  }
}
