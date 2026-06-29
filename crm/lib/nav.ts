import {
  LayoutDashboard,
  Users,
  Dog,
  Watch,
  Bell,
  CreditCard,
  Inbox,
  Stethoscope,
  Megaphone,
  BarChart3,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** When true, route is not built yet — shows a "Coming soon" stub. */
  comingSoon?: boolean;
  group: "Customers" | "Operations" | "Growth" | "Finance" | "Insights" | "Admin";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Insights" },

  { label: "Owners", href: "/dashboard/owners", icon: Users, group: "Customers" },
  { label: "Dogs", href: "/dashboard/dogs", icon: Dog, group: "Customers", comingSoon: true },
  { label: "Devices", href: "/dashboard/devices", icon: Watch, group: "Operations", comingSoon: true },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell, group: "Operations", comingSoon: true },
  { label: "Inbox", href: "/dashboard/inbox", icon: Inbox, group: "Operations", comingSoon: true },

  { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone, group: "Growth", comingSoon: true },
  { label: "Vets", href: "/dashboard/vets", icon: Stethoscope, group: "Growth", comingSoon: true },

  { label: "Billing", href: "/dashboard/billing", icon: CreditCard, group: "Finance", comingSoon: true },

  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, group: "Insights", comingSoon: true },
  { label: "Audit", href: "/dashboard/audit", icon: ShieldCheck, group: "Admin", comingSoon: true },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, group: "Admin", comingSoon: true },
];

export const NAV_GROUPS: NavItem["group"][] = [
  "Insights",
  "Customers",
  "Operations",
  "Growth",
  "Finance",
  "Admin",
];
