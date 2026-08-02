export type JsonPathEngine = {
  id: string;
  name: string;
  execute: (
    json: unknown,
    query: string,
  ) => unknown;
};