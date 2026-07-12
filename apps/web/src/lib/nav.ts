import {
  Brain,
  Briefcase,
  LayoutDashboard,
  ListOrdered,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Briefing", shortLabel: "Briefing", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", shortLabel: "Portfolio", icon: Briefcase },
  { href: "/trades", label: "Activity", shortLabel: "Activity", icon: ListOrdered },
  { href: "/insights", label: "AI decisions", shortLabel: "AI", icon: Brain },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
];
