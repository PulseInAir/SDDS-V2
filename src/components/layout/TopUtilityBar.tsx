"use client";

import { UserCircle, Menu } from "lucide-react";
import { PrivacyToggle } from "@/components/ui/PrivacyToggle";
import { AssessmentYearSelect } from "@/components/ui/AssessmentYearSelect";
import { IconButton } from "@/components/ui/IconButton";
import { GlobalSearch } from "@/components/layout/GlobalSearch";

export function TopUtilityBar() {
  return (
    <header className="flex min-h-[60px] flex-shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-surface-panel px-4 py-3 sm:px-6">
      <div className="flex flex-1 items-center gap-x-4">
        {/* Mobile menu button stub */}
        <div className="md:hidden">
          <IconButton variant="ghost" title="Open menu">
            <Menu className="h-5 w-5 text-text-muted" />
          </IconButton>
        </div>
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-x-3 sm:gap-x-4">
        <AssessmentYearSelect />
        <div className="h-6 w-px bg-border-subtle hidden sm:block" aria-hidden="true" />
        <PrivacyToggle />
        <div className="h-6 w-px bg-border-subtle hidden sm:block" aria-hidden="true" />
        <button type="button" className="text-text-muted hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 rounded-full">
          <UserCircle className="h-7 w-7" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
