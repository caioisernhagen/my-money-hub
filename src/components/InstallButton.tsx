import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "./ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Verificar se é iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 2. Verificar se já está instalado (modo standalone)
    const isAppStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");
    setIsStandalone(isAppStandalone);

    // 3. Capturar o evento de instalação (Chrome/Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log("✓ Evento beforeinstallprompt capturado");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error("Erro na instalação:", error);
    }
  };

  // Se já estiver instalado, não mostra nada
  if (isStandalone) return null;

  // Renderização para iOS (Instrução manual)
  if (isIOS) {
    return (
      <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-center">Para instalar no seu iPhone:</p>
        <div className="flex items-center gap-2 text-sm font-medium">
          Clique em <Share className="h-4 w-4" /> e depois em
          <span className="underline">"Adicionar à Tela de Início"</span>
        </div>
      </div>
    );
  }

  // Renderização para Android/Chrome (Botão Automático)
  if (deferredPrompt) {
    return (
      <Button
        onClick={handleInstallClick}
        variant="default"
        size="sm"
        className="gap-2 w-full "
      >
        <Download className="h-4 w-4" />
        Instalar App
      </Button>
    );
  }

  return null;
}
