"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils/styles";
import {
  LayoutDashboard,
  Users,
  Inbox,
  FileText,
  Receipt,
  IndianRupee,
  AlertCircle,
  PhoneCall,
  Settings,
  LogOut
} from "lucide-react";
import { signOut } from "@/app/(auth)/login/actions";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Filing Queue", href: "/filing-queue", icon: Inbox },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Refunds", href: "/refunds", icon: IndianRupee },
  { name: "Notices", href: "/notices", icon: AlertCircle },
  { name: "Follow-up", href: "/follow-up", icon: PhoneCall },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex h-full w-[248px] flex-col border-r border-border-subtle bg-surface-panel">
      <div className="flex h-[60px] items-center px-6">
        <span className="text-xl font-bold tracking-tight text-text-primary uppercase">SDDS</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                "group flex items-center rounded-[var(--radius-input)] px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-surface-selected text-brand-700"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
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
          href="/settings"
          className={classNames(
            "group flex items-center rounded-[var(--radius-input)] px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-surface-selected text-brand-700"
              : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          )}
        >
          <Settings
            className={classNames(
              "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
              pathname.startsWith("/settings")
                ? "text-brand-700"
                : "text-text-muted group-hover:text-text-secondary"
            )}
            aria-hidden="true"
          />
          Settings
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="group flex w-full items-center rounded-[var(--radius-input)] px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
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
  );
}
