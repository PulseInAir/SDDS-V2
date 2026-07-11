"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Menu, UserCircle, X, Plus } from "lucide-react";

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

export function TopUtilityBar({
  className,
  user,
}: {
  className?: string;
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
}) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const triggerButton = triggerButtonRef.current;

    if (!isMobileNavOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    // Rest of the existing keydown and listener logic
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
      <header className={classNames("flex min-h-[60px] flex-shrink-0 items-center justify-between gap-3 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-4 py-3 sm:px-6", className)}>
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
          <Link
            href="/clients/new"
            className="inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-input)] bg-white/[0.03] text-white/80 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30 border border-white/10 p-2 sm:px-4 sm:py-2 text-xs sm:text-sm shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
          >
            <Plus className="h-4 w-4 flex-shrink-0 sm:mr-1.5" />
            <span className="hidden sm:inline">Add Client</span>
          </Link>
          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden="true" />
          <AssessmentYearSelect />
          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden="true" />
          <PrivacyToggle />
          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden="true" />

          <div
            className="relative"
            ref={dropdownRef}
          >
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center rounded-full text-text-muted hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
              aria-label="Account menu"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="User avatar"
                  className="h-9 w-9 rounded-full object-cover border border-border-subtle"
                />
              ) : (
                <UserCircle className="h-9 w-9" aria-hidden="true" />
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-[var(--radius-input)] bg-[#0A0A0A]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-1 ring-white/10 focus:outline-none z-50 border border-white/10">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-white/5">
                    <p className="text-sm font-semibold text-white/90 truncate">
                      {user.fullName || "User"}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/settings/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex w-full items-center px-4 py-2 text-sm text-white/60 hover:bg-white/[0.05] hover:text-white"
                  >
                    <UserCircle className="mr-3 h-4 w-4 text-white/40" />
                    Admin Profile
                  </Link>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex w-full items-center px-4 py-2 text-sm text-white/60 hover:bg-white/[0.05] hover:text-white text-left"
                    >
                      <LogOut className="mr-3 h-4 w-4 text-white/40" />
                      Log Out
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
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
            className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-2rem))] flex-col border-r border-white/5 bg-[#050505] shadow-xl"
          >
            <div className="flex h-[60px] items-center justify-between border-b border-white/5 px-4">
              <div>
                <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-white/80 glow-brand">SDDS</p>
                <h2 id="mobile-navigation-title" className="text-sm font-semibold text-white/90">
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
                      "group flex items-center rounded-[var(--radius-input)] px-3 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
                      isActive
                        ? "bg-white/[0.05] text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border-l-[3px] border-white/30 rounded-l-none"
                        : "text-white/40 hover:bg-white/[0.02] hover:text-white/80 border-l-[3px] border-transparent",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon
                      className={classNames(
                        "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                        isActive ? "text-white" : "text-white/30 group-hover:text-white/60",
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-1 border-t border-white/5 p-3">
              <Link
                href={settingsNavigationItem.href}
                onClick={() => setIsMobileNavOpen(false)}
                className={classNames(
                  "group flex items-center rounded-[var(--radius-input)] px-3 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
                  isNavigationItemActive(pathname, settingsNavigationItem.href)
                    ? "bg-white/[0.05] text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border-l-[3px] border-white/30 rounded-l-none"
                    : "text-white/40 hover:bg-white/[0.02] hover:text-white/80 border-l-[3px] border-transparent",
                )}
                aria-current={isNavigationItemActive(pathname, settingsNavigationItem.href) ? "page" : undefined}
              >
                <settingsNavigationItem.icon
                  className={classNames(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isNavigationItemActive(pathname, settingsNavigationItem.href)
                      ? "text-white"
                      : "text-white/30 group-hover:text-white/60",
                  )}
                  aria-hidden="true"
                />
                {settingsNavigationItem.name}
              </Link>

              <form action={signOut}>
                <button
                  type="submit"
                  className="group flex w-full items-center rounded-[var(--radius-input)] px-3 py-3 text-sm font-medium text-white/40 transition-colors hover:bg-white/[0.02] hover:text-white/80 border-l-[3px] border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  <LogOut
                    className="mr-3 h-5 w-5 flex-shrink-0 text-white/30 group-hover:text-white/60"
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
