import Box from "@mui/material/Box";
import Editor from "@monaco-editor/react";

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
        height: 240,
        minHeight: 160,
        resize: "vertical",
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        borderRadius: 0.5,
      }}
    >
      <Editor
        theme="vs-dark"
        language={language}
        value={value}
        onChange={handleChange}
        options={{
          readOnly,
          minimap: { enabled: false },
          wordWrap: "on",
          automaticLayout: true,
        }}
      />
    </Box>
  );
}

export default CodeEditor;
