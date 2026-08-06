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
        Base64 Encode / Decode
      </Typography>

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={1}
        sx={{
          marginBottom: 3,
          flexShrink: 0,
        }}
      >
        <Button variant="outlined" onClick={() => handleEncode(input)}>
          Encode
        </Button>

        <Button variant="outlined" onClick={() => handleDecode(input)}>
          Decode
        </Button>

        <Button variant="outlined" color="inherit" onClick={handleClear}>
          Clear
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
            Input
          </Typography>

          <CodeEditor value={input} onChange={setInput} />
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
            Output
          </Typography>

          <CodeEditor value={output} readOnly />
        </Paper>
      </Box>
    </Box>
  );
}

export default Base64Tool;
