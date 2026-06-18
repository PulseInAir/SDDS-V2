import { ReactNode } from "react";
import { SidebarNav } from "./SidebarNav";
import { TopUtilityBar } from "./TopUtilityBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-surface-app">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SidebarNav />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopUtilityBar />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 focus:outline-none sm:p-6"
        >
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
