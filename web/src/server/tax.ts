// Tax for cross-border digital subscriptions.
//
// The selling entity is in Singapore (9% GST), but for B2C digital services the
// place of supply is the CUSTOMER's country, so each launch market's local rate
// applies: Thailand 7% (VES), Malaysia 8% (OVR), Vietnam 10% (deemed-supplier),
// Singapore 9% (home GST). See docs/05_launch_gaps_and_compliance.md §1.
//
// Pricing is TAX-INCLUSIVE: the displayed price ($5.99 / $44.99) is the gross the
// card is charged; the tax portion is extracted from it for remittance, so the
// charged amount never changes across markets.

const RATE_BPS: Record<string, number> = {
  SG: 900,  // GST (home jurisdiction)
  TH: 700,  // VAT on e-services (VES)
  MY: 800,  // service tax on digital services (OVR)
  VN: 1000, // VAT (deemed-supplier model from 1 Jul 2026)
};

// Fallback when the customer's country can't be resolved (defaults to the home entity).
export const DEFAULT_TAX_COUNTRY = (process.env.DEFAULT_TAX_COUNTRY || "SG").toUpperCase();

// Coarse UI-language → market mapping, used only as a fallback signal.
const LANG_COUNTRY: Record<string, string> = { th: "TH", vi: "VN", ms: "MY", en: "SG" };

export function countryForLang(lang?: string | null): string | null {
  return lang ? LANG_COUNTRY[lang] ?? null : null;
}

/**
 * Resolve the tax country. Billing address (from the PSP/card) is the primary,
 * legally-robust signal; UI language is a weak fallback; otherwise the home entity.
 */
export function resolveCountry(billingCountry?: string | null, lang?: string | null): string {
  return (billingCountry || countryForLang(lang) || DEFAULT_TAX_COUNTRY).toUpperCase();
}

export function taxRateBps(country?: string | null): number {
  return country ? RATE_BPS[country.toUpperCase()] ?? 0 : 0;
}

/** Split a tax-inclusive gross amount into net subtotal + tax (minor units). */
export function splitInclusive(grossMinor: number, rateBps: number): { subtotalMinor: number; taxMinor: number } {
  if (!rateBps) return { subtotalMinor: grossMinor, taxMinor: 0 };
  const net = Math.round((grossMinor * 10000) / (10000 + rateBps));
  return { subtotalMinor: net, taxMinor: grossMinor - net };
}
