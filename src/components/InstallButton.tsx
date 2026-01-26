import { useEffect, useState } from "react";

let deferredPrompt;

export default function InstallButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // impede popup automático
      deferredPrompt = e;
      setShow(true); // mostra botão
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt(); // abre o popup nativo
    const result = await deferredPrompt.userChoice;

    console.log("Resultado:", result.outcome);

    deferredPrompt = null;
    setShow(false);
  };

  if (!show) return null;

  return <button onClick={installApp}>Instalar aplicativo</button>;
}
