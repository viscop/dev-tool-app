import { useState } from "react";

import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";

import { decodeBase64, encodeBase64 } from "./base64";
import CodeEditor from "../../components/CodeEditor";

function Base64Tool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function handleEncode(value: string) {
    setOutput(encodeBase64(value));
    setError("");
  }

  function handleDecode(value: string) {
    try {
      setOutput(decodeBase64(value));
      setError("");
    } catch {
      setOutput("");
      setError("Invalid Base64 input");
    }
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setError("");
  }

  return (
    <Box component="section">
      <Typography variant="h4" component="h1" gutterBottom>
        Base64 Encode / Decode
      </Typography>

      <Stack direction="row" spacing={1} sx={{ marginBottom: 3 }}>
        <Button variant="contained" onClick={() => handleEncode(input)}>
          Encode
        </Button>

        <Button variant="outlined" onClick={() => handleDecode(input)}>
          Decode
        </Button>

        <Button color="inherit" onClick={handleClear}>
          Clear
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },
          gap: 2,
        }}
      >
        <Paper variant="outlined" sx={{ padding: 2 }}>
          <Typography variant="h6" component="h2" sx={{ marginBottom: 1 }}>
            Input
          </Typography>

          <CodeEditor value={input} onChange={setInput} />
        </Paper>

        <Paper variant="outlined" sx={{ padding: 2 }}>
          <Typography variant="h6" component="h2" sx={{ marginBottom: 1 }}>
            Output
          </Typography>

          <CodeEditor value={output} readOnly />
        </Paper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ marginTop: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

export default Base64Tool;
