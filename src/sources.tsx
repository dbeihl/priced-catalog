import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SourcesPage from "./SourcesPage";
import "./index.css";
import { site } from "./site.config";
import { applyMetadata } from "./site-metadata";

applyMetadata(site);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SourcesPage />
  </StrictMode>,
);
