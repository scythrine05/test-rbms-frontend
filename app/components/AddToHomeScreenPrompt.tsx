"use client";

import { useEffect, useState } from "react";

export default function AddToHomeScreenAuto() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // prevent default mini-infobar
      console.log("✅ beforeinstallprompt event saved");
      setPromptEvent(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (!promptEvent || hasInteracted) return;

    const triggerPrompt = async () => {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      console.log("User choice:", choice);
      setPromptEvent(null);
      setHasInteracted(true);
    };

    const handleFirstInteraction = () => {
      console.log("🟢 First user interaction - triggering prompt");
      triggerPrompt();
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [promptEvent, hasInteracted]);

  return null;
}
