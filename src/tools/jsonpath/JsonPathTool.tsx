import { useState } from "react";

import CodeEditor from "../../components/CodeEditor";
import { executeJsonPath } from "./jsonPath";
import type { JsonPathEngine } from "./engines/JsonPathEngine";
import { jsonPathPlusEngine } from "./engines/jsonPathPlusEngine";
import { goessnerOriginalEngine } from "./engines/goessnerOriginalEngine";
import { goessnerExtendedEngine } from "./engines/goessnerExtendedEngine";

import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { SelectChangeEvent } from "@mui/material/Select";

const engines: JsonPathEngine[] = [
  jsonPathPlusEngine,
  goessnerOriginalEngine,
  goessnerExtendedEngine,
];

function JsonPathTool() {
  const [jsonInput, setJsonInput] = useState("");
  const [query, setQuery] = useState("$");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [selectedEngine, setSelectedEngine] = useState<JsonPathEngine>(
    goessnerOriginalEngine,
  );

  function runQuery(
    jsonText: string,
    jsonPathQuery: string,
    engine: JsonPathEngine,
  ) {
    if (jsonText.trim() === "") {
      setOutput("");
      setError("");
      return;
    }

    try {
      const result = executeJsonPath(jsonText, jsonPathQuery, engine);

      setOutput(result);
      setError("");
    } catch (error: unknown) {
      setOutput("");

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Unknown error");
      }
    }
  }

  function handleEngineChange(event: SelectChangeEvent) {
    const engineId = event.target.value;

    const engine = engines.find((item) => item.id === engineId);

    if (!engine) {
      return;
    }

    setSelectedEngine(engine);
    runQuery(jsonInput, query, engine);
  }

  function handleQueryChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newQuery = event.currentTarget.value;

    setQuery(newQuery);
    runQuery(jsonInput, newQuery, selectedEngine);
  }

  function handleRun() {
    runQuery(jsonInput, query, selectedEngine);
    /*
        try {
            const result = executeJsonPath(
                jsonInput,
                query,
                selectedEngine,
            );

            setOutput(result);
            setError("");
        } catch (error: unknown) {
            setOutput("");

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Unknown error");
            }
        }
            */
  }

  return (
    <Box component="section">
      <Typography variant="h4" component="h1" gutterBottom>
        JSONPath Query
      </Typography>

      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        spacing={2}
        sx={{
          marginBottom: 3,
          alignItems: {
            xs: "stretch",
            md: "flex-start",
          },
        }}
      >
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="jsonpath-engine-label">Engine</InputLabel>

          <Select
            labelId="jsonpath-engine-label"
            value={selectedEngine.id}
            label="Engine"
            onChange={handleEngineChange}
          >
            {engines.map((engine) => (
              <MenuItem key={engine.id} value={engine.id}>
                {engine.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Query"
          value={query}
          onChange={handleQueryChange}
          fullWidth
        />

        <Button
          variant="contained"
          onClick={handleRun}
          sx={{
            minWidth: 130,
            height: 56,
          }}
        >
          Run Query
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 font-medium">JSON Input</h3>

          <CodeEditor
            value={jsonInput}
            onChange={setJsonInput}
            language="json"
          />
        </div>

        <div>
          <h3 className="mb-2 font-medium">Result</h3>

          <CodeEditor value={output} language="json" readOnly />
        </div>
      </div>
    </Box>
  );
}

export default JsonPathTool;
