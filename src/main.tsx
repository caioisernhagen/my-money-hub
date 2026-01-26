import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// REGISTRA O SERVICE WORKER AQUI
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Usa a base URL configurada no vite.config.ts
    const baseUrl = import.meta.env.BASE_URL;
    const swPath = `${baseUrl}service-worker.js`;

    navigator.serviceWorker
      .register(swPath)
      .then((reg) => {
        console.log("✓ Service Worker registrado em:", swPath);
      })
      .catch((err) => {
        console.error("✗ Erro ao registrar Service Worker:", err);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
