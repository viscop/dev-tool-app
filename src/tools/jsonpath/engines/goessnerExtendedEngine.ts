import { goessnerJsonPath } from
  "../implementations/goessnerExtended";

import type { JsonPathEngine } from "./JsonPathEngine";

export const goessnerExtendedEngine: JsonPathEngine = {
  id: "goessner-extended",
  name: "Goessner Extended",

  execute(json, query) {
    return goessnerJsonPath(json, query);
  },
};