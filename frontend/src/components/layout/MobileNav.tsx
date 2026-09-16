"use client";

import { WORKSPACE_NAV_ITEMS } from "./nav-items";
import { NavLink } from "./NavLink";

/** Bottom tab bar for small screens — mirrors the desktop Sidebar's nav items. */
export function MobileBottomNav() {
  return (
    <nav
      aria-label="Workspace"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-between gap-0.5 border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom,0px)] pt-1 lg:hidden"
    >
      {WORKSPACE_NAV_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} variant="mobile" />
      ))}
    </nav>
  );
}
