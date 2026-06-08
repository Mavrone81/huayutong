// API client. Auth + billing hit the real backend (/api/v1, see src/app/api).
// Learning data (dashboard) is still mock until those tables are populated.
import { DashboardData } from "./types";

const BASE = "/api/v1";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function call(path: string, opts: RequestInit = {}) {
  const r = await fetch(BASE + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new ApiError(r.status, body?.error?.message || "Request failed", body?.error?.code);
  return body;
}

export interface PlanDTO { code: string; name: string; interval: string | null; trialDays: number; priceLabel: string; popular: boolean }
export interface SubscriptionDTO {
  id: string; status: string; cancelAtPeriodEnd: boolean; planCode: string; priceLabel: string;
  trialEndsAt: string | null; currentPeriodEnd: string | null; paymentMethod: string;
}

export const api = {
  // ---- auth ----
  register: (body: { email: string; password: string; ui_language?: string; goal?: string }) =>
    call("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (email: string, password: string) =>
    call("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => call("/auth/logout", { method: "POST" }),
  getCurrentUser: () => call("/me"),

  // ---- billing ----
  getPlans: (): Promise<PlanDTO[]> => call("/billing/plans"),
  setupIntent: () => call("/billing/setup-intent", { method: "POST" }),
  startTrial: (planCode: string, paymentMethod: string) =>
    call("/billing/trials", { method: "POST", body: JSON.stringify({ plan_code: planCode, payment_method: paymentMethod }) }),
  cancelSubscription: () => call("/billing/subscription/cancel", { method: "POST" }),
  /** Returns the subscription, or null if none / not signed in. */
  getSubscription: async (): Promise<SubscriptionDTO | null> => {
    const r = await fetch(BASE + "/billing/subscription", { credentials: "include" });
    if (r.status === 401) return null;
    const j = await r.json().catch(() => null);
    return j?.subscription ?? null;
  },

  // ---- learning (real, Postgres-backed) ----
  getProgress: (): Promise<ProgressDTO> => call("/me/progress"),
  getCourses: () => call("/courses"),
  getLesson: (id: string): Promise<LessonDTO> => call(`/lessons/${id}`),
  completeLesson: (id: string, score = 100): Promise<{ xpAwarded: number; streak: number; accuracy: number }> =>
    call(`/lessons/${id}/complete`, { method: "POST", body: JSON.stringify({ score }) }),
  getSrsQueue: () => call("/srs/queue"),
  submitReview: (cardId: string, grade: number) =>
    call("/srs/reviews", { method: "POST", body: JSON.stringify({ cardId, grade }) }),
  setDailyGoal: (minutes: number) => call("/me/daily-goal", { method: "PUT", body: JSON.stringify({ minutes }) }),

  // ---- HSK prep (real) ----
  getReadiness: (): Promise<ReadinessDTO> => call("/me/readiness"),
  getStudyPlan: (): Promise<{ plan: { id: string; targetLevel: number; examDate: string | null } | null; tasks: PlanTask[] }> => call("/study-plans/active"),
  createStudyPlan: (targetLevel: number, examDate: string | null) => call("/study-plans", { method: "POST", body: JSON.stringify({ targetLevel, examDate }) }),
  toggleTask: (id: string): Promise<{ isDone: boolean }> => call(`/study-plan-tasks/${id}`, { method: "PATCH" }),
  getMockExams: (): Promise<{ mockExams: MockExam[] }> => call("/mock-exams"),
  startAttempt: (mockExamId: string): Promise<{ attemptId: string }> => call(`/mock-exams/${mockExamId}/attempts`, { method: "POST" }),
  getAttempt: (id: string): Promise<AttemptDTO> => call(`/attempts/${id}`),
  submitAttempt: (id: string, responses: { itemId: string; chosenGloss: string; section: string }[]): Promise<{ score: number; sections: { name: string; score: number }[] }> =>
    call(`/attempts/${id}/submit`, { method: "POST", body: JSON.stringify({ responses }) }),
};

export interface ReadinessDTO {
  hasPlan: boolean; targetLevel?: number; examDate?: string | null; daysLeft?: number | null;
  readinessPct?: number; estimatedLevel?: number; wordsMastered?: number; wordsNeeded?: number; lastMockScore?: number | null;
  sectionScores?: { name: string; score: number }[]; history?: { pct: number; at: string }[];
}
export interface PlanTask { id: string; due_date: string; description_key: string; lesson_id: string | null; is_done: boolean }
export interface MockExam { id: string; hsk_level: number; title_key: string; duration_minutes: number; best_score: number | null; attempts: number }
export interface AttemptQuestion { itemId: string; hanzi: string; pinyin: string; section: string; options: string[]; answer: number }
export interface AttemptDTO { attemptId: string; level: number; title: string; durationMinutes: number; questions: AttemptQuestion[] }

export interface ProgressSkill { hanzi: string; title: string; lessonId: string; sub: string; progress: number; state: "done" | "active" | "locked"; color: string }
export interface ProgressDTO {
  xp: number; streak: number; longestStreak: number; reviewsDue: number;
  goalMinutes: number; goalDone: number; hsk1Readiness: number;
  nextLessonId: string | null;
  skills: ProgressSkill[];
  srs: { hanzi: string; gloss: string; due: string }[];
}
export interface LessonItemDTO { id: string; hanzi: string; pinyin: string; audioUrl: string | null; gloss: string; options: string[]; answer: number }
export interface LessonDTO { id: string; title: string; icon: string; items: LessonItemDTO[] }
