"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Menu, UserCircle, X } from "lucide-react";

import { PrivacyToggle } from "@/components/ui/PrivacyToggle";
import { AssessmentYearSelect } from "@/components/ui/AssessmentYearSelect";
import { IconButton } from "@/components/ui/IconButton";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { signOut } from "@/app/(auth)/login/actions";
import { classNames } from "@/lib/utils/styles";
import {
  isNavigationItemActive,
  primaryNavigation,
  settingsNavigationItem,
} from "@/components/layout/navigation";

export function TopUtilityBar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const triggerButton = triggerButtonRef.current;

    if (!isMobileNavOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableItems = mobileNavRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableItems || focusableItems.length === 0) {
        return;
      }

      const firstItem = focusableItems[0];
      const lastItem = focusableItems[focusableItems.length - 1];

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.body.style.removeProperty("overflow");
      document.removeEventListener("keydown", handleKeydown);
      triggerButton?.focus();
    };
  }, [isMobileNavOpen]);

  return (
    <>
      <header className={classNames("flex min-h-[60px] flex-shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-surface-panel px-4 py-3 sm:px-6", className)}>
        <div className="flex min-w-0 flex-1 items-center gap-x-4">
          <div className="md:hidden">
            <IconButton
              ref={triggerButtonRef}
              variant="ghost"
              title="Open navigation"
              aria-label="Open navigation"
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </IconButton>
          </div>
          <div className="min-w-0 flex-1">
            <GlobalSearch />
          </div>
        </div>

        <div className="flex items-center gap-x-3 sm:gap-x-4">
          <AssessmentYearSelect />
          <div className="hidden h-6 w-px bg-border-subtle sm:block" aria-hidden="true" />
          <PrivacyToggle />
          <div className="hidden h-6 w-px bg-border-subtle sm:block" aria-hidden="true" />
          <button
            type="button"
            className="rounded-full text-text-muted hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            aria-label="Account menu"
          >
            <UserCircle className="h-7 w-7" aria-hidden="true" />
          </button>
        </div>
      </header>

      {isMobileNavOpen ? (
        <div className="md:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-navigation-title">
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/35"
            aria-label="Close navigation overlay"
            onClick={() => setIsMobileNavOpen(false)}
          />

          <div
            id="mobile-navigation"
            ref={mobileNavRef}
            className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-2rem))] flex-col border-r border-border-subtle bg-surface-panel shadow-xl"
          >
            <div className="flex h-[60px] items-center justify-between border-b border-border-subtle px-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">SDDS</p>
                <h2 id="mobile-navigation-title" className="text-sm font-semibold text-text-primary">
                  Navigation
                </h2>
              </div>
              <IconButton
                ref={closeButtonRef}
                variant="ghost"
                aria-label="Close navigation"
                title="Close navigation"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <X className="h-5 w-5 text-text-muted" aria-hidden="true" />
              </IconButton>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
              {primaryNavigation.map((item) => {
                const isActive = isNavigationItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={classNames(
                      "group flex items-center rounded-[var(--radius-input)] px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
                      isActive
                        ? "bg-surface-selected text-brand-700"
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon
                      className={classNames(
                        "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                        isActive ? "text-brand-700" : "text-text-muted group-hover:text-text-secondary",
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-1 border-t border-border-subtle p-3">
              <Link
                href={settingsNavigationItem.href}
                onClick={() => setIsMobileNavOpen(false)}
                className={classNames(
                  "group flex items-center rounded-[var(--radius-input)] px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
                  isNavigationItemActive(pathname, settingsNavigationItem.href)
                    ? "bg-surface-selected text-brand-700"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
                )}
                aria-current={isNavigationItemActive(pathname, settingsNavigationItem.href) ? "page" : undefined}
              >
                <settingsNavigationItem.icon
                  className={classNames(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isNavigationItemActive(pathname, settingsNavigationItem.href)
                      ? "text-brand-700"
                      : "text-text-muted group-hover:text-text-secondary",
                  )}
                  aria-hidden="true"
                />
                {settingsNavigationItem.name}
              </Link>

              <form action={signOut}>
                <button
                  type="submit"
                  className="group flex w-full items-center rounded-[var(--radius-input)] px-3 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  <LogOut
                    className="mr-3 h-5 w-5 flex-shrink-0 text-text-muted group-hover:text-text-secondary"
                    aria-hidden="true"
                  />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
