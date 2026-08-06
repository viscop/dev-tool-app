import Editor from "@monaco-editor/react";
import Box from "@mui/material/Box";

type CodeEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  language?: string;
};

function CodeEditor({
  value,
  onChange,
  readOnly = false,
  language = "plaintext",
}: CodeEditorProps) {
  function handleChange(newValue: string | undefined) {
    onChange?.(newValue ?? "");
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        value={value}
        onChange={handleChange}
        options={{
          readOnly,
          minimap: {
            enabled: false,
          },
          wordWrap: "on",
          automaticLayout: true,
        }}
      />
    </Box>
  );
}

export default CodeEditor;
