import type { JsonPathEngine } from "./engines/JsonPathEngine";

export function executeJsonPath(
  jsonText: string,
  query: string,
  engine: JsonPathEngine,
): string {
  const json: unknown = JSON.parse(jsonText);

  const result = engine.execute(json, query);

  if (Array.isArray(result) && result.length === 0) {
    throw new Error("No matches found.");
  }

  return JSON.stringify(result, null, 2);
}