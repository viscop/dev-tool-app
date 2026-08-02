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
    <div className="h-60 min-h-40 resize-y overflow-hidden border">
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
    </div>
  );
}

export default CodeEditor;