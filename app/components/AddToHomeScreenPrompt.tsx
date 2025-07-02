"use client";

import { useEffect, useState } from "react";

export default function AddToHomeScreenPrompt() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [hasPrompted, setHasPrompted] = useState(false);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      console.log("✅ beforeinstallprompt event captured");
      setPromptEvent(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Trigger prompt on first interaction
  useEffect(() => {
    if (!promptEvent || hasPrompted) return;

    const handleInteraction = async () => {
      try {
        console.log("⚡ Prompting install...");
        promptEvent.prompt();
        const result = await promptEvent.userChoice;
        console.log("🧾 User choice:", result.outcome);
        setHasPrompted(true);
        setPromptEvent(null);
      } catch (error) {
        console.error("❌ Error showing A2HS prompt:", error);
      }
    };

    const interactionHandler = () => {
      handleInteraction();
      window.removeEventListener("click", interactionHandler);
      window.removeEventListener("touchstart", interactionHandler);
    };

    window.addEventListener("click", interactionHandler);
    window.addEventListener("touchstart", interactionHandler);

    return () => {
      window.removeEventListener("click", interactionHandler);
      window.removeEventListener("touchstart", interactionHandler);
    };
  }, [promptEvent, hasPrompted]);

  return null;
}
