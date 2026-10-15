/**
 * Formats a value for display by appending a unit only if the value is not null, undefined, or empty.
 * If the value is missing, it returns the provided fallback (defaults to an empty string).
 *
 * @param value - The value to format (string or number)
 * @param unit - Optional string to append as a unit (e.g., "km/h", "m", "°")
 * @param fallback - Optional fallback string to return when value is missing (default: '')
 * @returns A formatted string like "42 km/h", or the fallback value
 */

type Constructor<T> = {
  new (): T
}

type Queryable = {
  querySelector(selector: string): Element | null
  querySelectorAll(selector: string): NodeListOf<Element>
}

const isNodeListOfElement = <T extends Element>(
  elements: NodeListOf<Element>,
  expectedConstructor: Constructor<T>,
): elements is NodeListOf<T> => {
  return [...elements.values()].every(element => element instanceof expectedConstructor)
}

export const queryElement = <T extends Element>(
  parent: Queryable,
  selector: string,
  expectedConstructor?: Constructor<T>,
): T => {
  const el = parent.querySelector(selector)

  if (!el) {
    throw new Error(`Selector "${selector}" did not match any elements.`)
  }

  if (expectedConstructor && !(el instanceof expectedConstructor)) {
    throw new Error(`Element matched by "${selector}" is not an instance of ${expectedConstructor.name}.`)
  }

  return el as T
}

export const queryElementAll = <T extends Element>(
  parent: Queryable,
  selector: string,
  expectedConstructor: Constructor<T>,
): NodeListOf<T> => {
  const elements = parent.querySelectorAll(selector)

  if (expectedConstructor && isNodeListOfElement(elements, expectedConstructor)) {
    return elements
  }

  throw new Error(`Elements matched by "${selector}" are not instances of ${expectedConstructor.name}.`)
}
