import { useState } from "react";
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
        <section>
            <h2>Base64 Encode / Decode</h2>

            <div className="mb-4 flex gap-2">
                <button
                    className="rounded border px-3 py-2"
                    onClick={() => handleEncode(input)}
                >
                    Encode
                </button>

                <button
                    className="rounded border px-3 py-2"
                    onClick={() => handleDecode(input)}
                >
                    Decode
                </button>

                <button
                    className="rounded border px-3 py-2"
                    onClick={handleClear}
                >
                    Clear
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <h3 className="mb-2 font-medium">Input</h3>

                    <CodeEditor
                        value={input}
                        onChange={setInput}
                    />
                </div>

                <div>
                    <h3 className="mb-2 font-medium">Output</h3>

                    <CodeEditor
                        value={output}
                        readOnly
                    />
                </div>
            </div>

            {error && <p>{error}</p>}

        </section>
    );
}

export default Base64Tool;