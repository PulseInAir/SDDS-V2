import {
  AlertCircle,
  FileText,
  IndianRupee,
  Inbox,
  LayoutDashboard,
  PhoneCall,
  Receipt,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export const primaryNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Filing Queue", href: "/filing-queue", icon: Inbox },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Refunds", href: "/refunds", icon: IndianRupee },
  { name: "Notices", href: "/notices", icon: AlertCircle },
  { name: "Follow-up", href: "/follow-up", icon: PhoneCall },
];

export const settingsNavigationItem: NavigationItem = {
  name: "Settings",
  href: "/settings",
  icon: Settings,
};

export function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}
