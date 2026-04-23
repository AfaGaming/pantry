import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Reset browser default styles
const globalStyle = document.createElement("style");
globalStyle.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; color: #f0f0f0; -webkit-font-smoothing: antialiased; }
  input, select, button, textarea { font-family: inherit; }
  ::-webkit-scrollbar { display: none; }
`;
document.head.appendChild(globalStyle);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
