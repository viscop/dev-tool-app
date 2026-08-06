import { useState, type ChangeEvent } from "react";

import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { SelectChangeEvent } from "@mui/material/Select";

import CodeEditor from "../../components/CodeEditor";
import { executeJsonPath } from "./jsonPath";

import type { JsonPathEngine } from "./engines/JsonPathEngine";

import { jsonPathPlusEngine } from "./engines/jsonPathPlusEngine";

import { goessnerOriginalEngine } from "./engines/goessnerOriginalEngine";

import { goessnerExtendedEngine } from "./engines/goessnerExtendedEngine";

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

  function handleQueryChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const newQuery = event.currentTarget.value;

    setQuery(newQuery);

    runQuery(jsonInput, newQuery, selectedEngine);
  }

  function handleRun() {
    runQuery(jsonInput, query, selectedEngine);
  }

  return (
    <Box
      component="section"
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ flexShrink: 0 }}
      >
        JSONPath Query
      </Typography>

      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        spacing={1}
        sx={{
          marginBottom: 2,
          flexShrink: 0,
          alignItems: {
            xs: "stretch",
            md: "center",
          },
        }}
      >
        <FormControl
          size="small"
          sx={{
            minWidth: 200,
          }}
        >
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
          size="small"
          label="Query"
          value={query}
          onChange={handleQueryChange}
          fullWidth
        />

        <Button
          size="small"
          variant="contained"
          onClick={handleRun}
          sx={{
            minWidth: 120,
            height: 40,
          }}
        >
          Run Query
        </Button>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{
            marginBottom: 2,
            flexShrink: 0,
          }}
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },

          gridTemplateRows: {
            xs: "repeat(2, minmax(300px, 1fr))",
            md: "minmax(0, 1fr)",
          },

          gap: 2,
          flex: 1,
          minHeight: 0,

          overflow: {
            xs: "auto",
            md: "hidden",
          },
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            padding: 2,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              marginBottom: 1,
              flexShrink: 0,
            }}
          >
            JSON Input
          </Typography>

          <CodeEditor
            value={jsonInput}
            onChange={setJsonInput}
            language="json"
          />
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            padding: 2,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              marginBottom: 1,
              flexShrink: 0,
            }}
          >
            Result
          </Typography>

          <CodeEditor value={output} language="json" readOnly />
        </Paper>
      </Box>
    </Box>
  );
}

export default JsonPathTool;
