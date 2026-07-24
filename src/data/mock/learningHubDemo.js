const DEMO_TIMESTAMP = '2026-07-22T08:00:00.000Z'

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }

  return value
}

const CANONICAL_LEARNING_HUB_DEMO_SEED = deepFreeze({
  learningHub: {
    schemaVersion: 2,
    dataOrigin: 'synthetic',
    modules: [
      {
        id: 'demo-module-ai-foundations',
        title: '[Demo] KI-Grundlagen – vom Datensatz zum Transformer',
        position: 1,
        chapters: [
          {
            id: 'demo-chapter-ai-classification',
            title: 'KI einordnen',
            position: 1,
            learningNodes: [
              {
                id: 'demo-node-ai-ml-dl',
                title: 'KI, Machine Learning und Deep Learning',
                content: 'Künstliche Intelligenz ist der Oberbegriff für Systeme, die Aufgaben mit intelligent wirkendem Verhalten bearbeiten. Machine Learning ist ein Teilgebiet davon: Modelle lernen Muster aus Beispieldaten, statt dass jede Regel einzeln programmiert wird. Deep Learning ist wiederum ein Teilgebiet des Machine Learning und nutzt neuronale Netze mit vielen Verarbeitungsschichten.',
                position: 1,
              },
              {
                id: 'demo-node-weak-strong-ai',
                title: 'Schwache und starke KI',
                content: 'Schwache KI ist auf einen begrenzten Aufgabenbereich zugeschnitten, etwa Bilderkennung, Übersetzung oder Routenplanung. Starke KI bezeichnet dagegen die bisher nicht erreichte Vorstellung eines Systems, das Wissen flexibel über viele Bereiche hinweg versteht, überträgt und ähnlich allgemein wie ein Mensch handeln kann.',
                position: 2,
              },
            ],
          },
          {
            id: 'demo-chapter-data-quality',
            title: 'Datenqualität',
            position: 2,
            learningNodes: [
              {
                id: 'demo-node-garbage-in-out',
                title: 'Garbage in, garbage out',
                content: 'Ein Lernverfahren kann nur Muster aus den Daten ableiten, die ihm zur Verfügung stehen. Fehlerhafte Beschriftungen, fehlende Fälle oder einseitige Stichproben führen deshalb oft zu unzuverlässigen oder unfairen Ergebnissen. Gute Datenqualität verlangt passende, korrekte und ausreichend vielfältige Beispiele sowie eine Prüfung der Ergebnisse für relevante Gruppen und Situationen.',
                position: 1,
              },
            ],
          },
          {
            id: 'demo-chapter-transformers',
            title: 'Transformer verstehen',
            position: 3,
            learningNodes: [
              {
                id: 'demo-node-attention-context',
                title: 'Attention und Kontext',
                content: 'Transformer verarbeiten Text mithilfe von Attention. Dabei bewertet das Modell für jedes Token, welche anderen Tokens im verfügbaren Kontext besonders relevant sind. So kann dieselbe Zeichenfolge je nach Umgebung unterschiedlich repräsentiert werden. Attention ist keine menschliche Aufmerksamkeit und garantiert weder Wahrheit noch echtes Verständnis.',
                position: 1,
              },
            ],
          },
        ],
      },
    ],
  },
  artifactStore: {
    schemaVersion: 1,
    dataOrigin: 'synthetic',
    artifacts: [
      {
        id: 'demo-artifact-ai-ml-dl-note',
        type: 'note',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-ai-classification',
        learningNodeId: 'demo-node-ai-ml-dl',
        content: 'KI beschreibt ein breites Ziel: Maschinen sollen Aufgaben lösen, für die Menschen typischerweise Wahrnehmung, Sprache, Planung oder Schlussfolgern einsetzen. Machine Learning ist ein möglicher Weg dorthin. Ein Modell bekommt Beispiele und passt interne Parameter so an, dass es auf neue, ähnliche Eingaben reagieren kann. Deep Learning nutzt dafür mehrschichtige neuronale Netze und ist besonders bei großen Datenmengen für Bild-, Sprach- und Textaufgaben verbreitet. Nicht jedes KI-System lernt aus Daten; auch ein fest programmiertes Regelsystem kann als KI-Anwendung gelten.',
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
      {
        id: 'demo-artifact-ai-ml-dl-summary',
        type: 'summary',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-ai-classification',
        learningNodeId: 'demo-node-ai-ml-dl',
        content: 'KI ist der Oberbegriff. Machine Learning ist ein Teilgebiet der KI und lernt Muster aus Daten. Deep Learning ist ein Teilgebiet des Machine Learning und verwendet mehrschichtige neuronale Netze.',
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
      {
        id: 'demo-artifact-weak-strong-ai-note',
        type: 'note',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-ai-classification',
        learningNodeId: 'demo-node-weak-strong-ai',
        content: 'Heutige KI-Systeme gelten als schwache oder spezialisierte KI. Ein Übersetzungsmodell kann Sprache übertragen, besitzt dadurch aber keine allgemeine Fähigkeit, beliebige neue Lebensprobleme zu lösen. Auch leistungsfähige generative Modelle arbeiten innerhalb erlernter Muster und technischer Grenzen. Starke KI ist ein theoretisches Konzept für bereichsübergreifende, allgemein einsetzbare Intelligenz. Die Begriffe beschreiben den Umfang der Fähigkeiten und sagen nicht, dass eine spezialisierte KI harmlos, fehlerfrei oder tatsächlich bewusst ist.',
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
      {
        id: 'demo-artifact-weak-strong-ai-summary',
        type: 'summary',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-ai-classification',
        learningNodeId: 'demo-node-weak-strong-ai',
        content: 'Schwache KI bearbeitet begrenzte Aufgaben. Starke KI wäre bereichsübergreifend und allgemein einsetzbar, ist aber bislang ein theoretisches Konzept. Spezialisierung sagt nichts über Fehlerfreiheit oder Bewusstsein aus.',
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
      {
        id: 'demo-artifact-garbage-in-out-note',
        type: 'note',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-data-quality',
        learningNodeId: 'demo-node-garbage-in-out',
        content: '„Garbage in, garbage out“ bedeutet: Ein technisch gutes Lernverfahren kann schlechte Eingangsdaten nicht automatisch in verlässliche Ergebnisse verwandeln. Sind Fotos falsch beschriftet, fehlen wichtige Alltagssituationen oder ist eine Gruppe kaum vertreten, lernt das Modell ein verzerrtes Bild. Neben Genauigkeit sind deshalb Relevanz, Vollständigkeit, Aktualität und Repräsentativität wichtig. Daten sollten vor dem Training geprüft und Ergebnisse anschließend auf getrennten, realistischen Testdaten sowie für relevante Teilgruppen ausgewertet werden.',
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
      {
        id: 'demo-artifact-garbage-in-out-summary',
        type: 'summary',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-data-quality',
        learningNodeId: 'demo-node-garbage-in-out',
        content: 'Fehlerhafte, lückenhafte oder einseitige Daten führen häufig zu unzuverlässigen Ergebnissen. Daten und Resultate müssen auf Korrektheit, Relevanz, Vielfalt und mögliche Verzerrungen geprüft werden.',
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
      {
        id: 'demo-artifact-attention-context-note',
        type: 'note',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-transformers',
        learningNodeId: 'demo-node-attention-context',
        content: 'Ein Transformer zerlegt Text in Tokens und erzeugt für sie numerische Repräsentationen. Self-Attention berechnet, welche anderen Tokens für die aktuelle Verarbeitung besonders wichtig sind. Im Satz „Die Bank vergab einen Kredit“ stützen etwa „vergab“ und „Kredit“ die Bedeutung als Geldinstitut; in „Die Bank steht im Park“ weist „Park“ eher auf eine Sitzbank hin. Mehrere Attention-Köpfe können unterschiedliche Beziehungen erfassen. Das Verfahren nutzt statistische Muster im begrenzten Kontext und ist kein Beleg für Bewusstsein oder garantiert richtige Aussagen.',
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
      {
        id: 'demo-artifact-attention-context-summary',
        type: 'summary',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-transformers',
        learningNodeId: 'demo-node-attention-context',
        content: 'Self-Attention gewichtet Beziehungen zwischen Tokens und erzeugt dadurch kontextabhängige Repräsentationen. Sie verarbeitet statistische Muster, ist keine menschliche Aufmerksamkeit und garantiert keine Wahrheit.',
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
    ],
  },
  testBank: {
    schemaVersion: 1,
    dataOrigin: 'synthetic',
    questions: [
      {
        id: 'demo-question-ai-hierarchy',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-ai-classification',
        learningNodeId: 'demo-node-ai-ml-dl',
        type: 'singleChoice',
        prompt: 'Welche Aussage ordnet KI, Machine Learning und Deep Learning korrekt ein?',
        difficulty: 'easy',
        position: 1,
        revision: 1,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
        options: [
          {
            id: 'demo-option-ai-hierarchy-unrelated',
            label: 'Die drei Begriffe bezeichnen voneinander unabhängige Verfahren.',
            position: 1,
          },
          {
            id: 'demo-option-ai-hierarchy-correct',
            label: 'Deep Learning ist ein Teilgebiet des Machine Learning, das wiederum ein Teilgebiet der KI ist.',
            position: 2,
          },
          {
            id: 'demo-option-ai-hierarchy-reversed',
            label: 'KI ist ein Teilgebiet des Deep Learning.',
            position: 3,
          },
          {
            id: 'demo-option-ai-hierarchy-rules',
            label: 'Machine Learning arbeitet ausschließlich mit fest programmierten Regeln und ohne Daten.',
            position: 4,
          },
        ],
        correctOptionId: 'demo-option-ai-hierarchy-correct',
        explanation: 'KI ist der Oberbegriff. Machine Learning ist ein datenbasiertes Teilgebiet der KI, und Deep Learning ist eine Form des Machine Learning mit mehrschichtigen neuronalen Netzen.',
      },
      {
        id: 'demo-question-learning-from-examples',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-ai-classification',
        learningNodeId: 'demo-node-ai-ml-dl',
        type: 'singleChoice',
        prompt: 'Ein Spamfilter verbessert seine Vorhersagen anhand vieler als Spam oder Nicht-Spam markierter E-Mails. Welche Aussage lässt sich daraus sicher ableiten?',
        difficulty: 'medium',
        position: 2,
        revision: 1,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
        options: [
          {
            id: 'demo-option-learning-examples-ml',
            label: 'Der Filter nutzt Machine Learning, weil er Muster aus gekennzeichneten Beispielen ableitet.',
            position: 1,
          },
          {
            id: 'demo-option-learning-examples-strong-ai',
            label: 'Der Filter ist starke KI, weil er neue E-Mails verarbeiten kann.',
            position: 2,
          },
          {
            id: 'demo-option-learning-examples-programmed',
            label: 'Jede spätere Entscheidung muss zuvor als einzelne Regel programmiert worden sein.',
            position: 3,
          },
          {
            id: 'demo-option-learning-examples-quality',
            label: 'Die Qualität der markierten Beispiele hat keinen Einfluss auf den Filter.',
            position: 4,
          },
        ],
        correctOptionId: 'demo-option-learning-examples-ml',
        explanation: 'Aus gekennzeichneten Beispielen Muster für neue Fälle zu lernen ist ein typischer Machine-Learning-Ablauf. Das macht das System weder allgemein intelligent noch unabhängig von der Datenqualität.',
      },
      {
        id: 'demo-question-weak-ai-example',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-ai-classification',
        learningNodeId: 'demo-node-weak-strong-ai',
        type: 'singleChoice',
        prompt: 'Welches Beispiel beschreibt am ehesten eine schwache KI?',
        difficulty: 'easy',
        position: 1,
        revision: 1,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
        options: [
          {
            id: 'demo-option-weak-ai-route',
            label: 'Ein System berechnet für vorgegebene Ziele passende Fahrtrouten.',
            position: 1,
          },
          {
            id: 'demo-option-weak-ai-general',
            label: 'Ein System überträgt selbstständig jedes Wissen auf beliebige neue Lebensbereiche.',
            position: 2,
          },
          {
            id: 'demo-option-weak-ai-conscious',
            label: 'Ein System besitzt nachweislich Bewusstsein und eigene allgemeine Ziele.',
            position: 3,
          },
          {
            id: 'demo-option-weak-ai-universal',
            label: 'Ein System löst ohne Spezialisierung jedes unbekannte Problem auf menschlichem Niveau.',
            position: 4,
          },
        ],
        correctOptionId: 'demo-option-weak-ai-route',
        explanation: 'Routenplanung ist ein klar begrenzter Aufgabenbereich und damit ein Beispiel für spezialisierte beziehungsweise schwache KI. Die anderen Optionen beschreiben Merkmale einer hypothetischen starken KI.',
      },
      {
        id: 'demo-question-gigo-labels',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-data-quality',
        learningNodeId: 'demo-node-garbage-in-out',
        type: 'singleChoice',
        prompt: 'Was ist die wahrscheinlichste Folge, wenn viele Trainingsbilder falsch beschriftet sind?',
        difficulty: 'easy',
        position: 1,
        revision: 1,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
        options: [
          {
            id: 'demo-option-gigo-labels-errors',
            label: 'Das Modell kann falsche Zusammenhänge lernen und dadurch unzuverlässiger vorhersagen.',
            position: 1,
          },
          {
            id: 'demo-option-gigo-labels-fix',
            label: 'Das Modell korrigiert sämtliche Beschriftungen automatisch und garantiert richtige Ergebnisse.',
            position: 2,
          },
          {
            id: 'demo-option-gigo-labels-speed',
            label: 'Nur die Rechengeschwindigkeit sinkt; die Vorhersagen bleiben unverändert.',
            position: 3,
          },
          {
            id: 'demo-option-gigo-labels-more',
            label: 'Eine größere Menge falsch beschrifteter Bilder verbessert das Ergebnis in jedem Fall.',
            position: 4,
          },
        ],
        correctOptionId: 'demo-option-gigo-labels-errors',
        explanation: 'Falsche Beschriftungen liefern ein fehlerhaftes Lernsignal. Das Modell kann diese Fehler als Muster übernehmen; mehr fehlerhafte Daten lösen das Problem nicht automatisch.',
      },
      {
        id: 'demo-question-gigo-group-bias',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-data-quality',
        learningNodeId: 'demo-node-garbage-in-out',
        type: 'singleChoice',
        prompt: 'Ein Modell erreicht insgesamt eine hohe Genauigkeit, aber eine relevante Personengruppe ist in den Testdaten kaum vertreten. Welche Schlussfolgerung ist fachlich angemessen?',
        difficulty: 'hard',
        position: 2,
        revision: 1,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
        options: [
          {
            id: 'demo-option-gigo-bias-guaranteed',
            label: 'Die hohe Gesamtgenauigkeit garantiert automatisch gleich gute Ergebnisse für jede Gruppe.',
            position: 1,
          },
          {
            id: 'demo-option-gigo-bias-separate',
            label: 'Die Leistung für diese Gruppe bleibt unsicher und sollte mit ausreichend repräsentativen Daten getrennt geprüft werden.',
            position: 2,
          },
          {
            id: 'demo-option-gigo-bias-remove',
            label: 'Die Gruppe sollte aus der späteren Nutzung ausgeschlossen werden, damit die Kennzahl stabil bleibt.',
            position: 3,
          },
          {
            id: 'demo-option-gigo-bias-training-only',
            label: 'Nur Trainingsdaten können verzerrt sein; die Zusammensetzung der Testdaten ist bedeutungslos.',
            position: 4,
          },
        ],
        correctOptionId: 'demo-option-gigo-bias-separate',
        explanation: 'Eine aggregierte Kennzahl kann schwache Ergebnisse kleiner Teilgruppen verdecken. Repräsentative Testdaten und getrennte Auswertungen sind nötig, bevor Aussagen über diese Gruppe möglich sind.',
      },
      {
        id: 'demo-question-attention-purpose',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-transformers',
        learningNodeId: 'demo-node-attention-context',
        type: 'singleChoice',
        prompt: 'Welche Aufgabe erfüllt Self-Attention in einem Transformer am ehesten?',
        difficulty: 'medium',
        position: 1,
        revision: 1,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
        options: [
          {
            id: 'demo-option-attention-purpose-weight',
            label: 'Sie gewichtet Beziehungen zwischen Tokens, um kontextabhängige Repräsentationen zu bilden.',
            position: 1,
          },
          {
            id: 'demo-option-attention-purpose-database',
            label: 'Sie ersetzt jedes Token durch einen unveränderlichen Eintrag aus einer Wissensdatenbank.',
            position: 2,
          },
          {
            id: 'demo-option-attention-purpose-truth',
            label: 'Sie prüft automatisch, ob jede Aussage im Text wahr ist.',
            position: 3,
          },
          {
            id: 'demo-option-attention-purpose-human',
            label: 'Sie bildet menschliche Aufmerksamkeit und Bewusstsein vollständig nach.',
            position: 4,
          },
        ],
        correctOptionId: 'demo-option-attention-purpose-weight',
        explanation: 'Self-Attention bewertet, welche Tokens für die aktuelle Repräsentation besonders relevant sind. Sie ist eine mathematische Gewichtung und weder Wahrheitsprüfung noch menschliches Bewusstsein.',
      },
      {
        id: 'demo-question-attention-bank-context',
        moduleId: 'demo-module-ai-foundations',
        chapterId: 'demo-chapter-transformers',
        learningNodeId: 'demo-node-attention-context',
        type: 'singleChoice',
        prompt: 'Warum kann ein Transformer „Bank“ in „Die Bank vergab einen Kredit“ anders verarbeiten als in „Die Bank steht im Park“?',
        difficulty: 'hard',
        position: 2,
        revision: 1,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
        options: [
          {
            id: 'demo-option-attention-context-random',
            label: 'Die Bedeutung wird bei jedem Auftreten unabhängig vom Satz zufällig gewählt.',
            position: 1,
          },
          {
            id: 'demo-option-attention-context-neighbors',
            label: 'Attention bezieht umgebende Tokens wie „Kredit“ oder „Park“ in die Repräsentation ein.',
            position: 2,
          },
          {
            id: 'demo-option-attention-context-fixed',
            label: 'Jedes Wort besitzt im Transformer immer genau eine feste, kontextfreie Repräsentation.',
            position: 3,
          },
          {
            id: 'demo-option-attention-context-conscious',
            label: 'Der Transformer erlebt beide Situationen und entscheidet bewusst zwischen ihnen.',
            position: 4,
          },
        ],
        correctOptionId: 'demo-option-attention-context-neighbors',
        explanation: 'Durch Attention beeinflussen relevante Wörter im Satz die Repräsentation von „Bank“. So kann das Modell statistisch zwischen Geldinstitut und Sitzmöbel unterscheiden, ohne die Situation bewusst zu erleben.',
      },
    ],
  },
})

export const LEARNING_HUB_DEMO_SEED = CANONICAL_LEARNING_HUB_DEMO_SEED
export const LEARNING_HUB_DEMO = LEARNING_HUB_DEMO_SEED.learningHub
export const LEARNING_ARTIFACT_DEMO =
  LEARNING_HUB_DEMO_SEED.artifactStore
export const LEARNING_TEST_BANK_DEMO = LEARNING_HUB_DEMO_SEED.testBank

export function createPrivateLearningHubDemoSeed() {
  const privateSeed = structuredClone(LEARNING_HUB_DEMO_SEED)

  privateSeed.learningHub.dataOrigin = 'private'
  privateSeed.artifactStore.dataOrigin = 'private'
  privateSeed.testBank.dataOrigin = 'private'

  return privateSeed
}
