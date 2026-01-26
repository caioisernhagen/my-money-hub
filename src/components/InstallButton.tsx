import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "./ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export default function InstallButton() {
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      console.log("✓ beforeinstallprompt capturado");
      setShowInstall(true);
    };

    const handleAppInstalled = () => {
      console.log("✓ App instalado com sucesso!");
      deferredPrompt = null;
      setShowInstall(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.error("✗ Prompt de instalação não disponível");
      return;
    }

    setIsInstalling(true);

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`✓ Instalação: ${outcome}`);

      if (outcome === "accepted") {
        deferredPrompt = null;
        setShowInstall(false);
      }
    } catch (error) {
      console.error("✗ Erro durante instalação:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  if (!showInstall) return null;

  return (
    <Button
      onClick={handleInstallClick}
      disabled={isInstalling}
      variant="default"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isInstalling ? "Instalando..." : "Instalar App"}
    </Button>
  );
}
