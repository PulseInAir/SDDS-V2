"use client";

import { Search, UserCircle, Menu } from "lucide-react";
import { PrivacyToggle } from "@/components/ui/PrivacyToggle";
import { AssessmentYearSelect } from "@/components/ui/AssessmentYearSelect";
import { IconButton } from "@/components/ui/IconButton";

export function TopUtilityBar() {
  return (
    <header className="flex h-[60px] flex-shrink-0 items-center justify-between border-b border-border-subtle bg-surface-panel px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-x-4">
        {/* Mobile menu button stub */}
        <div className="md:hidden">
          <IconButton variant="ghost" title="Open menu">
            <Menu className="h-5 w-5 text-text-muted" />
          </IconButton>
        </div>
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-text-muted" aria-hidden="true" />
          </div>
          <input
            type="search"
            placeholder="Search clients, PAN, cases..."
            className="block w-full rounded-[var(--radius-input)] border-0 py-1.5 pl-10 pr-3 text-text-primary ring-1 ring-inset ring-border-subtle placeholder:text-text-muted focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6"
          />
        </div>
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
