import { useState } from "react";

import CodeEditor from "../../components/CodeEditor";
import { executeJsonPath } from "./jsonPath";
import type { JsonPathEngine } from "./engines/JsonPathEngine";
import { jsonPathPlusEngine } from "./engines/jsonPathPlusEngine";
import { goessnerOriginalEngine } from "./engines/goessnerOriginalEngine";
import { goessnerExtendedEngine } from "./engines/goessnerExtendedEngine";

const engines: JsonPathEngine[] = [
    jsonPathPlusEngine,
    goessnerOriginalEngine,
    goessnerExtendedEngine
];

function JsonPathTool() {
    const [jsonInput, setJsonInput] = useState("");
    const [query, setQuery] = useState("$");
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const [selectedEngine, setSelectedEngine] = useState<JsonPathEngine>(goessnerOriginalEngine);

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
            const result = executeJsonPath(
                jsonText,
                jsonPathQuery,
                engine,
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
    }

    function handleEngineChange(
        event: React.ChangeEvent<HTMLSelectElement>,
    ) {
        const engineId = event.currentTarget.value;

        const engine = engines.find(
            (item) => item.id === engineId,
        );

        if (!engine) {
            return;
        }

        setSelectedEngine(engine);
        runQuery(jsonInput, query, engine);
    }

    function handleQueryChange(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
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
        <section>
            <h2 className="mb-4 text-xl font-semibold">
                JSONPath Query
            </h2>

            <select
                className="mb-4 rounded border px-3 py-2"
                value={selectedEngine.id}
                onChange={handleEngineChange}
            >
                {engines.map((engine) => (
                    <option
                        key={engine.id}
                        value={engine.id}
                    >
                        {engine.name}
                    </option>
                ))}
            </select>

            <input
                className="mb-4 w-full rounded border px-3 py-2"
                type="text"
                value={query}
                //onChange={(event) => setQuery(event.currentTarget.value)}
                onChange={handleQueryChange}
            />

            <button
                className="mb-4 rounded border px-3 py-2"
                onClick={handleRun}
            >
                Run Query
            </button>

            {error && (
                <p className="mb-4">
                    {error}
                </p>
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

                    <CodeEditor
                        value={output}
                        language="json"
                        readOnly
                    />
                </div>
            </div>
        </section>
    );
}

export default JsonPathTool;