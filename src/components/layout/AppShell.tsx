import { ReactNode } from "react";
import { SidebarNav } from "./SidebarNav";
import { TopUtilityBar } from "./TopUtilityBar";
import { CinematicEffects } from "@/components/ui/CinematicEffects";

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
}) {
  return (
    <div className="flex min-h-dvh w-full bg-transparent">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SidebarNav className="print:hidden" />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden print:overflow-visible">
        <TopUtilityBar user={user} className="print:hidden" />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 focus:outline-none sm:p-6 print:overflow-visible print:p-0"
        >
          <div className="mx-auto max-w-[1600px] w-full">
            {children}
          </div>
        </main>
      </div>
      <CinematicEffects />
    </div>
  );
}
