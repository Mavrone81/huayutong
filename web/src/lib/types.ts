// Shared types — mirror the shapes in docs/03_api.md & docs/openapi.yaml.
import { Lang } from "./dict";

export type SubscriptionStatus =
  | "trialing" | "active" | "past_due" | "canceled" | "expired";

export interface User {
  id: string;
  name: string;
  email: string;
  uiLanguage: Lang;
  goal: "casual" | "conversation" | "hsk_exam" | "business";
  streak: number;
  xp: number;
  entitlement: { tier: "free" | "premium"; source: SubscriptionStatus | "none"; validUntil?: string };
}

export interface Plan {
  code: "free" | "premium_monthly" | "premium_annual";
  name: string;
  priceLabel: string;
  interval: "month" | "year" | null;
  features: string[];
  popular?: boolean;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  planCode: Plan["code"];
  priceLabel: string;
  trialEndsAt: string;
  paymentMethod: string;
}

export interface SrsItem { hanzi: string; gloss: string; due: string }
export interface SkillRow {
  hanzi: string; title: string; sub: string; progress: number;
  state: "done" | "active" | "locked"; color: string;
}
export interface DashboardData {
  goalMinutes: number; goalDone: number; streak: number; reviewsDue: number;
  hsk1Readiness: number; skills: SkillRow[]; srs: SrsItem[];
}
