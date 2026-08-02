import { useState } from "react";
import Base64Tool from "./tools/base64/Base64Tool";
import ToolButton from "./components/ToolButton";
import JsonPathTool from "./tools/jsonpath/JsonPathTool";

type Tool = "base64" | "jsonpath";

function App() {
  const [activeTool, setActiveTool] = useState<Tool>("base64");

  return (
    <main className="min-h-screen bg-[#1d2125] p-6 text-slate-300">
      <h1 className="text-3xl font-bold">
        Dev Tools
      </h1>

      <nav className="my-4 flex gap-2 border px-0.5">
        <ToolButton
          label="Base64"
          active={activeTool === "base64"}
          onClick={() => setActiveTool("base64")}
        />

        <ToolButton
          label="JSONPath"
          active={activeTool === "jsonpath"}
          onClick={() => setActiveTool("jsonpath")}
        />
      </nav>

      {activeTool === "base64" && <Base64Tool />}

      {activeTool === "jsonpath" && <JsonPathTool />}
      
    </main>
  );
}

export default App;