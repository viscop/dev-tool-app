import { Navigate, Route, Routes } from "react-router";

import AppLayout from "./app/AppLayout";
import Base64Tool from "./tools/base64/Base64Tool";
import JsonPathTool from "./tools/jsonpath/JsonPathTool";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/base64" replace />} />

        <Route path="base64" element={<Base64Tool />} />

        <Route path="jsonpath" element={<JsonPathTool />} />
      </Route>
    </Routes>
  );
}

export default App;
