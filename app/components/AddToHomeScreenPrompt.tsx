"use client";

import { useEffect, useState } from "react";

export default function AddToHomeScreenPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [promptShown, setPromptShown] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Trigger prompt on first tap/click
  useEffect(() => {
    if (!deferredPrompt || promptShown) return;

    const autoTrigger = async () => {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setPromptShown(true);
      setDeferredPrompt(null);
    };

    const handleUserInteraction = () => {
      autoTrigger();
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };

    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("touchstart", handleUserInteraction);
  }, [deferredPrompt, promptShown]);

  return null; // no UI needed
}
