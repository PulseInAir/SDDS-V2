"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils/styles";
import { isNavigationItemActive, primaryNavigation, settingsNavigationItem } from "@/components/layout/navigation";

export function SidebarNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={classNames("hidden md:flex h-full w-[280px] flex-col border-r border-border-subtle bg-surface-panel", className)}>
      <div className="flex h-[60px] items-center px-7 border-b border-border-subtle bg-surface-muted/30">
        <span className="text-lg font-extrabold tracking-wider text-brand-700 uppercase">SDDS Suite</span>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        {primaryNavigation.map((item) => {
          const isActive = isNavigationItemActive(pathname, item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                "group flex items-center rounded-[var(--radius-input)] pl-3 pr-4 py-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
                isActive
                  ? "bg-brand-50/80 text-brand-700 shadow-xs border-l-[3px] border-brand-600 rounded-l-none"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary border-l-[3px] border-transparent"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={classNames(
                  "mr-3 h-[18px] w-[18px] flex-shrink-0 transition-colors",
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

      <div className="border-t border-border-subtle p-4 space-y-1.5">
        <Link
          href={settingsNavigationItem.href}
          className={classNames(
            "group flex items-center rounded-[var(--radius-input)] pl-3 pr-4 py-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
            isNavigationItemActive(pathname, settingsNavigationItem.href)
              ? "bg-brand-50/80 text-brand-700 shadow-xs border-l-[3px] border-brand-600 rounded-l-none"
              : "text-text-secondary hover:bg-surface-hover hover:text-text-primary border-l-[3px] border-transparent"
          )}
          aria-current={isNavigationItemActive(pathname, settingsNavigationItem.href) ? "page" : undefined}
        >
          <settingsNavigationItem.icon
            className={classNames(
              "mr-3 h-[18px] w-[18px] flex-shrink-0 transition-colors",
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
