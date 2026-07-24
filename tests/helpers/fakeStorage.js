export class FakeStorage {
  constructor(initialEntries = []) {
    this.entries = new Map(
      initialEntries.map(([key, value]) => [String(key), String(value)])
    )
    this.readError = null
    this.writeError = null
    this.removeError = null
    this.getItemCalls = 0
    this.setItemCalls = 0
    this.removeItemCalls = 0
  }

  getItem(key) {
    this.getItemCalls += 1

    if (this.readError) {
      throw this.readError
    }

    const normalizedKey = String(key)

    return this.entries.has(normalizedKey)
      ? this.entries.get(normalizedKey)
      : null
  }

  setItem(key, value) {
    this.setItemCalls += 1

    if (this.writeError) {
      throw this.writeError
    }

    this.entries.set(String(key), String(value))
  }

  removeItem(key) {
    this.removeItemCalls += 1

    if (this.removeError) {
      throw this.removeError
    }

    this.entries.delete(String(key))
  }

  peek(key) {
    const normalizedKey = String(key)

    return this.entries.has(normalizedKey)
      ? this.entries.get(normalizedKey)
      : null
  }
}

export function createStorageError(name) {
  const error = new Error('Simulierter Storage-Fehler')
  error.name = name

  return error
}
