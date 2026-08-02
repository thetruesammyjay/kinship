import type { LucideIcon } from "lucide-react";
import { BarChart3, Home, Network, ShieldCheck, UserPlus } from "lucide-react";

/**
 * The one shared navigation config, used by both the desktop LeftRail and the
 * mobile BottomNav so they can never drift (same pattern as the ChumBucket
 * example). Every route maps onto one of these via `also`, so the right tab
 * stays lit.
 */
export type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  also: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", Icon: Home, also: [] },
  { href: "/register", label: "Register", Icon: UserPlus, also: [] },
  { href: "/tree", label: "Tree", Icon: Network, also: [] },
  { href: "/verify", label: "Verify", Icon: ShieldCheck, also: [] },
  { href: "/evaluation", label: "Metrics", Icon: BarChart3, also: [] },
];

/** Is `href` (or one of its `also` prefixes) the active route for `path`? */
export function isNavActive(path: string, href: string, also: string[]): boolean {
  const seg = (p: string) => path === p || path.startsWith(`${p}/`);
  return seg(href) || also.some(seg);
}
