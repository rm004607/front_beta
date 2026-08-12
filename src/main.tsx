import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

createRoot(document.getElementById("root")!).render(<App />);

// PWA: registrar service worker (necesario para instalar en pantalla de inicio).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* si falla el registro, la web sigue funcionando igual */
    });
  });
}
