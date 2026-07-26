/**
 * React Hook Form receives an empty number input as an empty string. Converting it with
 * `valueAsNumber` produces NaN, which is still a value and therefore fails optional
 * schemas. Keep empty fields absent and convert only entered values.
 */
export function optionalNumberInput(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}
