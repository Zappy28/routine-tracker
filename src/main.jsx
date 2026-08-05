import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import { LoadingBarProvider } from "./context/LoadingBarContext";
import "./index.css";


createRoot(document.getElementById("root")).render(

  <StrictMode>
    <LoadingBarProvider>
      <App />
    </LoadingBarProvider>
  </StrictMode>

);
