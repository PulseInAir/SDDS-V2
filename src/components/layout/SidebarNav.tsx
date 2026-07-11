"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils/styles";
import { isNavigationItemActive, primaryNavigation, settingsNavigationItem } from "@/components/layout/navigation";

export function SidebarNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={classNames("hidden md:flex flex-shrink-0 h-full w-[280px] flex-col border-r border-white/5 bg-[#050505]", className)}>
      <div className="flex h-[60px] items-center px-7 border-b border-white/5 bg-white/[0.02]">
        <span className="text-[11px] font-mono tracking-[0.25em] text-white/80 uppercase glow-brand">SDDS SUITE</span>
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
                  ? "bg-white/[0.05] text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border-l-[3px] border-white/30 rounded-l-none"
                  : "text-white/40 hover:bg-white/[0.02] hover:text-white/80 border-l-[3px] border-transparent"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={classNames(
                  "mr-3 h-[18px] w-[18px] flex-shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-white/30 group-hover:text-white/60"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-4 space-y-1.5">
        <Link
          href={settingsNavigationItem.href}
          className={classNames(
            "group flex items-center rounded-[var(--radius-input)] pl-3 pr-4 py-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
            isNavigationItemActive(pathname, settingsNavigationItem.href)
              ? "bg-white/[0.05] text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border-l-[3px] border-white/30 rounded-l-none"
              : "text-white/40 hover:bg-white/[0.02] hover:text-white/80 border-l-[3px] border-transparent"
          )}
          aria-current={isNavigationItemActive(pathname, settingsNavigationItem.href) ? "page" : undefined}
        >
          <settingsNavigationItem.icon
            className={classNames(
              "mr-3 h-[18px] w-[18px] flex-shrink-0 transition-colors",
              isNavigationItemActive(pathname, settingsNavigationItem.href)
                ? "text-white"
                : "text-white/30 group-hover:text-white/60"
            )}
            aria-hidden="true"
          />
          {settingsNavigationItem.name}
        </Link>
      </div>
    </div>
  );
}
