import { describe, it, expect } from "vitest";
import { pricePreview, priceLabel } from "./pricing";

// en-ZA's CLDR thousands separator is U+00A0 (non-breaking space), not a
// comma — confirmed directly against this environment's ICU data, not
// assumed. Every amount assertion below builds the expected string with
// this, matching what the app actually renders.
const nbsp = " ";

// Part E1's money rule ("round each line half-up to minor units, then sum")
// starts here: this is the one place a rand amount turns into what a couple
// actually sees on a supplier card, both while a supplier is still typing it
// (pricePreview) and once it's saved (priceLabel). Wrong here is wrong
// everywhere downstream — and both are now dependency-free enough to test
// without dragging in a live Supabase client.
describe("pricePreview (onboarding — raw rand text as typed)", () => {
  it("formats a flat rate with a 'From' prefix", () => {
    expect(pricePreview("total", "35000")).toBe(`From R35${nbsp}000`);
  });

  it("formats per-head pricing", () => {
    expect(pricePreview("per_head", "450")).toBe("R450 per head");
  });

  it("formats per-hour pricing", () => {
    expect(pricePreview("per_hour", "1200")).toBe(`R1${nbsp}200 per hour`);
  });

  it("formats per-day pricing", () => {
    expect(pricePreview("per_day", "8000")).toBe(`R8${nbsp}000 per day`);
  });

  it("quote_only ignores the amount entirely", () => {
    expect(pricePreview("quote_only", "999999")).toBe("Price on request");
    expect(pricePreview("quote_only", "")).toBe("Price on request");
  });

  it("shows an em-dash placeholder for zero, blank, or invalid input", () => {
    expect(pricePreview("total", "")).toBe("—");
    expect(pricePreview("total", "0")).toBe("—");
    expect(pricePreview("per_head", "not a number")).toBe("—");
  });

  it("rounds to whole rand rather than showing cents", () => {
    expect(pricePreview("total", "35000.60")).toBe(`From R35${nbsp}001`);
    expect(pricePreview("total", "35000.40")).toBe(`From R35${nbsp}000`);
  });

  it("rejects a negative amount as unpriced rather than showing 'From R-500'", () => {
    // Found by writing this test, not by clicking: parseFloat("-500") is a
    // real negative number (not NaN), so the original blank/NaN-only guard
    // let it straight through to "From R-500". Fixed in lib/pricing.ts.
    expect(pricePreview("total", "-500")).toBe("—");
  });
});

describe("priceLabel (portal / public display — already-saved cents)", () => {
  it("quote_only ignores cents entirely, even null", () => {
    expect(priceLabel("quote_only", null)).toBe("Price on request");
    expect(priceLabel("quote_only", 500000)).toBe("Price on request");
  });

  it("returns null (not a placeholder string) when no price has been set", () => {
    expect(priceLabel("total", null)).toBeNull();
  });

  it("formats each unit consistently with pricePreview's own phrasing", () => {
    expect(priceLabel("total", 3500000)).toBe(`From R35${nbsp}000`);
    expect(priceLabel("per_head", 45000)).toBe("R450 per head");
    expect(priceLabel("per_hour", 120000)).toBe(`R1${nbsp}200 per hour`);
    expect(priceLabel("per_day", 800000)).toBe(`R8${nbsp}000 per day`);
  });

  it("agrees with pricePreview for the same amount, unit by unit", () => {
    // This is the actual contract that matters: what a supplier previews at
    // signup must read back identically once it's a saved row in their own
    // portal. Assert it directly instead of trusting the phrasing stayed
    // in sync by eye.
    for (const unit of ["total", "per_head", "per_hour", "per_day"] as const) {
      expect(priceLabel(unit, 123400)).toBe(pricePreview(unit, "1234"));
    }
  });
});
