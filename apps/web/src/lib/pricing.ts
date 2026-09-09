// Pure money-formatting helpers, deliberately dependency-free (no Supabase
// client, no React) so they can be unit-tested without dragging in a live
// network client at module scope. Previously lived inside SupplierOnboarding.tsx
// and duplicated in SupplierPortal.tsx; consolidated here per WBS-01 (Part E1's
// money rules apply to both the onboarding preview and the portal's own display).

export type PricingUnit = "total" | "per_head" | "per_hour" | "per_day" | "quote_only";

export const PRICING_UNITS: { key: PricingUnit; label: string; hint: string }[] = [
  { key: "total", label: "Flat rate", hint: "e.g. From R35,000" },
  { key: "per_head", label: "Per head", hint: "e.g. R450 per head" },
  { key: "per_hour", label: "Per hour", hint: "e.g. R1,200 per hour" },
  { key: "per_day", label: "Per day", hint: "e.g. R8,000 per day" },
  { key: "quote_only", label: "Quote only", hint: "No public price — clients ask you directly" },
];

const rand = (cents: number) => `R${Math.round(cents / 100).toLocaleString("en-ZA")}`;

// Onboarding preview: takes the raw rand-amount text the supplier is
// currently typing, before it's ever been saved as cents.
export function pricePreview(unit: PricingUnit, randInput: string): string {
  if (unit === "quote_only") return "Price on request";
  const cents = Math.round((parseFloat(randInput) || 0) * 100);
  if (!cents || cents < 0) return "—";
  const amount = rand(cents);
  if (unit === "total") return `From ${amount}`;
  if (unit === "per_head") return `${amount} per head`;
  if (unit === "per_hour") return `${amount} per hour`;
  return `${amount} per day`;
}

// Portal / public display: takes the already-saved price_from_cents column.
export function priceLabel(unit: string, cents: number | null): string | null {
  if (unit === "quote_only") return "Price on request";
  if (cents == null) return null;
  const amount = rand(cents);
  if (unit === "per_head") return `${amount} per head`;
  if (unit === "per_hour") return `${amount} per hour`;
  if (unit === "per_day") return `${amount} per day`;
  return `From ${amount}`;
}
