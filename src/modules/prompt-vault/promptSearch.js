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
  return (
    selectedCategory === ALL_CATEGORIES ||
    prompt?.category === selectedCategory
  )
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
