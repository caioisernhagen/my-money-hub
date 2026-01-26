import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// REGISTRA O SERVICE WORKER AQUI
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => {
        console.log("✓ Service Worker registrado:", reg);
      })
      .catch((err) => {
        console.error("✗ Erro ao registrar Service Worker:", err);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
