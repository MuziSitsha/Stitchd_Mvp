import {
  LayoutGrid, Store, Users, Banknote, Heart, MessageCircle,
  ClipboardCheck, ShoppingBag, Mail, Ticket, Utensils, CreditCard,
  Palette, Gift, CalendarRange, FileText, Crown, LifeBuoy,
  type LucideIcon,
} from "lucide-react";

// Merc's own direction, 15 Sept: revert the shell to stitchd-v9.jsx's own
// nav pattern — one flat, horizontally-scrolling row of pill buttons (see
// v9's own LENSES array + header JSX), not the grouped "6 top tabs, each
// with its own sub-tab row" IA a later, separate redesign concept
// ("Stitchd UI Enhancement", 24 Aug) had introduced into this shell. Every
// screen this app has grown since v9 stays — nothing here is dropped, this
// is a flatter list of the exact same Screen keys, not a smaller one.
// "Today" is the one screen v9 never had at all; kept as its own tab (his
// explicit call) since dropping it would throw away real, working product.
export type Screen =
  | "today" | "week"
  | "team"
  | "guestlist" | "rsvp" | "passes" | "seating"
  | "budget" | "payments"
  | "ourday" | "vision" | "gifts" | "runsheet" | "docs" | "coach" | "support"
  | "stitchit"
  | "lungi"
  | "portal";

export interface NavTab { key: Screen; label: string; icon: LucideIcon; glow?: boolean }

// v9's own order, roughly: Squad(->team) first as the pre-Today home
// screen, then Suppliers/Stitch It/Portal, then Budget/RSVP/Seating/Tasks/
// Timeline/Chat/Coach — with Today now leading it, and every screen v9
// never had (guestlist/passes/payments/ourday/vision/gifts/runsheet/docs/
// support) slotted in next to its nearest v9 relative rather than
// tacked on at the end.
export const NAV_TABS: NavTab[] = [
  { key: "today", label: "Today", icon: LayoutGrid },
  { key: "team", label: "Squad", icon: Store },
  { key: "stitchit", label: "Stitch It", icon: ShoppingBag, glow: true },
  { key: "budget", label: "Budget", icon: Banknote },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "guestlist", label: "Guests", icon: Users },
  { key: "rsvp", label: "RSVP", icon: Mail },
  { key: "passes", label: "Passes", icon: Ticket },
  { key: "seating", label: "Seating", icon: Utensils },
  { key: "week", label: "Tasks", icon: ClipboardCheck },
  { key: "runsheet", label: "Timeline", icon: CalendarRange },
  { key: "ourday", label: "Our day", icon: Heart },
  { key: "vision", label: "Vision", icon: Palette },
  { key: "gifts", label: "Gifts", icon: Gift },
  { key: "docs", label: "Documents", icon: FileText },
  { key: "lungi", label: "Chat", icon: MessageCircle },
  { key: "coach", label: "Coach", icon: Crown },
  { key: "support", label: "Support", icon: LifeBuoy },
];

// "portal" (Supplier Portal) deliberately stays off the main nav row, same
// reasoning as before this revert: it shows confidential cross-supplier
// data (every business's leads, earnings, verification), so it's reachable
// only via its own staff-only header pill (AppShell.tsx), never a tab
// anyone signed in could click into.
