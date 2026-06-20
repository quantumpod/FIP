import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Platform configuration and user management"
      icon={Settings}
      phase="Phase 1 — Database & Auth"
    />
  );
}
