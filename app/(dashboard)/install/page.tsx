import AddToHomeScreenPrompt from "@/app/components/AddToHomeScreenPrompt";

// app/(dashboard)/dashboard/settings/page.tsx
export default function SettingsPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Install</h1>
        <AddToHomeScreenPrompt /> 

    </div>
  );
}