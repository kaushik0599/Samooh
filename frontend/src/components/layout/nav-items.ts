import { LayoutGrid, Sparkles, FileText, Landmark, Users, Activity, Settings } from "lucide-react";

/** Single source of truth for workspace navigation — used by both Sidebar and MobileNav. */
export const WORKSPACE_NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: LayoutGrid },
  { href: "/sarthi", label: "Sarthi", icon: Sparkles },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/treasury", label: "Treasury", icon: Landmark },
  { href: "/members", label: "Members", icon: Users },
  { href: "/activity", label: "Activity", icon: Activity },
] as const;

export const SETTINGS_NAV_ITEM = { href: "/settings", label: "Settings", icon: Settings } as const;
