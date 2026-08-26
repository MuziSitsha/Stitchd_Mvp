import {
  LayoutGrid, Store, Users, Banknote, Heart, Zap, MessageCircle,
  ClipboardCheck, ShoppingBag, Mail, Ticket, Utensils, Wallet, CreditCard,
  Palette, Gift, CalendarRange, FileText, Crown,
  type LucideIcon,
} from "lucide-react";

// Mirrors the design handoff's own nav architecture exactly (its `subsFor`
// tab->sub-screens map and `tabOf` reverse lookup, computed once here
// instead of hand-maintained twice): one `Screen` per sub-tab, grouped
// under a `TopTab`. `TAB_OF[screen]` gives the active top tab for any
// screen; clicking a top tab jumps to `SUBS_FOR[tab][0].key`.
export type TopTab = "today" | "suppliers" | "guests" | "money" | "us" | "stitchit";

export type Screen =
  | "today" | "week"
  | "team" | "marketplace"
  | "guestlist" | "rsvp" | "passes" | "seating"
  | "budget" | "payments"
  | "ourday" | "vision" | "gifts" | "runsheet" | "docs" | "coach"
  | "stitchit"
  | "lungi"
  | "portal";

export interface SubTab { key: Screen; label: string; icon: LucideIcon }

export const TOP_TABS: { key: TopTab; label: string; icon: LucideIcon }[] = [
  { key: "today", label: "Today", icon: LayoutGrid },
  { key: "suppliers", label: "Suppliers", icon: Store },
  { key: "guests", label: "Guests", icon: Users },
  { key: "money", label: "Money", icon: Banknote },
  { key: "us", label: "Us", icon: Heart },
  { key: "stitchit", label: "Stitch It", icon: Zap },
];

export const SUBS_FOR: Record<TopTab, SubTab[]> = {
  today: [
    { key: "today", label: "Today", icon: LayoutGrid },
    { key: "week", label: "All tasks", icon: ClipboardCheck },
  ],
  suppliers: [
    { key: "team", label: "Your circle", icon: Store },
    { key: "marketplace", label: "Find someone", icon: ShoppingBag },
  ],
  guests: [
    { key: "guestlist", label: "Guest list", icon: Users },
    { key: "rsvp", label: "Invitations", icon: Mail },
    { key: "passes", label: "Passes", icon: Ticket },
    { key: "seating", label: "Seating", icon: Utensils },
  ],
  money: [
    { key: "budget", label: "Budget", icon: Wallet },
    { key: "payments", label: "Payments", icon: CreditCard },
  ],
  us: [
    { key: "ourday", label: "Our day", icon: Heart },
    { key: "vision", label: "Vision", icon: Palette },
    { key: "gifts", label: "Gifts", icon: Gift },
    { key: "runsheet", label: "The day", icon: CalendarRange },
    { key: "docs", label: "Documents", icon: FileText },
    { key: "coach", label: "Coach", icon: Crown },
  ],
  stitchit: [
    { key: "stitchit", label: "On demand", icon: ShoppingBag },
  ],
};

// "Ask Lungi" is a persistent header button + its own screen, not one of
// the 6 main tabs (matches the handoff exactly) — it still needs a
// TAB_OF entry so the sub-nav row can render its one pill when active.
export const LUNGI_SUB: SubTab = { key: "lungi", label: "Ask Lungi", icon: MessageCircle };

// "portal" (Supplier Portal) has no home in the new 6-tab IA at all —
// reachable only via its own staff-only header pill, no top-tab
// highlight, no sub-nav row — so it's deliberately absent here.
export const TAB_OF: Partial<Record<Screen, TopTab | "lungi">> = {
  lungi: "lungi",
  ...Object.fromEntries(
    (Object.entries(SUBS_FOR) as [TopTab, SubTab[]][]).flatMap(([tab, subs]) => subs.map((s) => [s.key, tab] as const)),
  ),
};

export function firstScreenOf(tab: TopTab): Screen {
  return SUBS_FOR[tab][0].key;
}
