import { goessnerJsonPath } from
  "../implementations/goessnerOriginal";

import type { JsonPathEngine } from "./JsonPathEngine";

export const goessnerOriginalEngine: JsonPathEngine = {
  id: "goessner-original",
  name: "Goessner Original",

  execute(json, query) {
    return goessnerJsonPath(json, query);
  },
};