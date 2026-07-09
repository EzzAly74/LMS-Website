/**
 * Returns a shallow copy of `filters` with null, undefined, and empty-string
 * values removed. Immutable — does not mutate the input. Used to clean list
 * query payloads (catalogue, assignments, quizzes) before an API call.
 */
export function removeNullFilterProperties<T extends Record<string, unknown>>(
  filters: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    ),
  ) as Partial<T>;
}
