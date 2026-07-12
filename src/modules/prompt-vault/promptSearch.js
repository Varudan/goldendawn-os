export const ALL_CATEGORIES = ''

const SEARCHABLE_PROMPT_FIELDS = Object.freeze([
  'title',
  'category',
  'description',
  'content',
])

function normalizeText(value) {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

function matchesQuery(prompt, normalizedQuery) {
  if (normalizedQuery.length === 0) {
    return true
  }

  return SEARCHABLE_PROMPT_FIELDS.some((fieldName) =>
    normalizeText(prompt?.[fieldName]).includes(normalizedQuery)
  )
}

function matchesCategory(prompt, selectedCategory) {
  const promptCategory =
    typeof prompt?.category === 'string' ? prompt.category.trim() : ''

  return (
    selectedCategory === ALL_CATEGORIES ||
    promptCategory === selectedCategory
  )
}

export function getPromptCategories(prompts) {
  if (!Array.isArray(prompts)) {
    return []
  }

  const categories = []
  const knownCategories = new Set()

  prompts.forEach((prompt) => {
    const category =
      typeof prompt?.category === 'string' ? prompt.category.trim() : ''

    if (category && !knownCategories.has(category)) {
      knownCategories.add(category)
      categories.push(category)
    }
  })

  return categories
}

export function filterPrompts(
  prompts,
  {
    query = '',
    category = ALL_CATEGORIES,
    favoritesOnly = false,
  } = {}
) {
  if (!Array.isArray(prompts)) {
    return []
  }

  const normalizedQuery = normalizeText(query).trim()
  const selectedCategory =
    typeof category === 'string' ? category.trim() : ALL_CATEGORIES

  return prompts.filter(
    (prompt) =>
      matchesQuery(prompt, normalizedQuery) &&
      matchesCategory(prompt, selectedCategory) &&
      (favoritesOnly !== true || prompt?.isFavorite === true)
  )
}
