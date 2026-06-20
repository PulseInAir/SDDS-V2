"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils/styles";
import { isNavigationItemActive, primaryNavigation, settingsNavigationItem } from "@/components/layout/navigation";

export function SidebarNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={classNames("hidden md:flex h-full w-[248px] flex-col border-r border-border-subtle bg-surface-panel", className)}>
      <div className="flex h-[60px] items-center px-6">
        <span className="text-xl font-bold tracking-tight text-text-primary uppercase">SDDS</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {primaryNavigation.map((item) => {
          const isActive = isNavigationItemActive(pathname, item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                "group flex items-center rounded-[var(--radius-input)] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
                isActive
                  ? "bg-surface-selected text-brand-700"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={classNames(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-brand-700"
                    : "text-text-muted group-hover:text-text-secondary"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-3 space-y-1">
        <Link
          href={settingsNavigationItem.href}
          className={classNames(
            "group flex items-center rounded-[var(--radius-input)] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
            isNavigationItemActive(pathname, settingsNavigationItem.href)
              ? "bg-surface-selected text-brand-700"
              : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          )}
          aria-current={isNavigationItemActive(pathname, settingsNavigationItem.href) ? "page" : undefined}
        >
          <settingsNavigationItem.icon
            className={classNames(
              "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
              isNavigationItemActive(pathname, settingsNavigationItem.href)
                ? "text-brand-700"
                : "text-text-muted group-hover:text-text-secondary"
            )}
            aria-hidden="true"
          />
          {settingsNavigationItem.name}
        </Link>
      </div>
    </div>
  );
}
