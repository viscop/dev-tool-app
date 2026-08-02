import { JSONPath } from "jsonpath-plus";
import type { JsonPathEngine } from "./JsonPathEngine";

export const jsonPathPlusEngine: JsonPathEngine = {
  id: "jsonpath-plus",
  name: "JSONPath Plus",

  execute(json, query) {
    return JSONPath({
      path: query,
      json: json as object,
    });
  },
};