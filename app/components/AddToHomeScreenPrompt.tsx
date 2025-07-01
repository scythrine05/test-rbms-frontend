// components/AddToHomeScreenPrompt.tsx
"use client";

import { useEffect, useState } from "react";

export default function AddToHomeScreenPrompt() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!promptEvent) return;
    (promptEvent as any).prompt();
    const result = await (promptEvent as any).userChoice;
    if (result.outcome === "accepted") {
      console.log("User accepted the A2HS prompt");
    }
    setPromptEvent(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-white shadow p-4 rounded">
      <p>Add this app to your home screen</p>
      <button
        className="bg-blue-600 text-white px-3 py-1 rounded mt-2"
        onClick={handleInstallClick}
      >
        Install
      </button>
    </div>
  );
}
