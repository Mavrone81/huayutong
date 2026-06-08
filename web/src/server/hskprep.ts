import { query, one } from "./db";

export class HskError extends Error {
  status: number; code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}

async function userLang(userId: string): Promise<string> {
  const u = await one<{ ui_language: string }>(`SELECT ui_language FROM users WHERE id = $1`, [userId]);
  return u?.ui_language || "en";
}

export async function activePlan(userId: string) {
  return one<{ id: string; target_level: number; exam_date: string | null; created_at: string }>(
    `SELECT id, target_level, exam_date, created_at FROM study_plans WHERE user_id = $1 AND is_active ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
}

async function computeReadiness(userId: string, target: number) {
  const attempts = await query<{ score: number }>(
    `SELECT score FROM mock_exam_attempts WHERE user_id = $1 AND state = 'scored' AND score IS NOT NULL ORDER BY submitted_at DESC LIMIT 5`,
    [userId]
  );
  const wordsMastered = (await one<{ n: number }>(
    `SELECT count(DISTINCT sc.item_id)::int AS n FROM srs_cards sc JOIN mandarin_items mi ON mi.id = sc.item_id WHERE sc.user_id = $1 AND mi.hsk_level <= $2`,
    [userId, target]
  ))!.n;
  const wordsNeeded = (await one<{ cumulative_vocab: number }>(`SELECT cumulative_vocab FROM hsk_levels WHERE level = $1`, [target]))?.cumulative_vocab || 0;

  let readinessPct: number;
  if (attempts.length) {
    const recent = attempts.slice(0, 3).map((a) => Number(a.score));
    readinessPct = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
  } else {
    readinessPct = wordsNeeded ? Math.min(100, Math.round((wordsMastered / wordsNeeded) * 100)) : 0;
  }
  const estimatedLevel = readinessPct >= 85 ? target : readinessPct >= 60 ? Math.max(1, target - 1) : Math.max(1, target - 2);
  return { readinessPct, estimatedLevel, wordsMastered, wordsNeeded, lastMockScore: attempts[0] ? Number(attempts[0].score) : null };
}

export async function getReadiness(userId: string) {
  const plan = await activePlan(userId);
  if (!plan) return { hasPlan: false };
  const r = await computeReadiness(userId, plan.target_level);
  const last = await one<{ answers: any; submitted_at: string }>(
    `SELECT answers, submitted_at FROM mock_exam_attempts WHERE user_id = $1 AND state = 'scored' ORDER BY submitted_at DESC LIMIT 1`,
    [userId]
  );
  const sectionScores = (last?.answers?.sections as { name: string; score: number }[]) || [];
  const history = (await query<{ readiness_pct: number; computed_at: string }>(
    `SELECT readiness_pct, computed_at FROM readiness_scores WHERE user_id = $1 ORDER BY computed_at DESC LIMIT 6`,
    [userId]
  )).reverse();

  let daysLeft: number | null = null;
  if (plan.exam_date) daysLeft = Math.max(0, Math.ceil((new Date(plan.exam_date).getTime() - Date.now()) / 86400000));

  return {
    hasPlan: true,
    targetLevel: plan.target_level,
    examDate: plan.exam_date,
    daysLeft,
    ...r,
    sectionScores,
    history: history.map((h) => ({ pct: Number(h.readiness_pct), at: h.computed_at })),
  };
}

export async function listMockExams(userId: string) {
  return query<any>(
    `SELECT me.id, me.hsk_level, me.title_key, me.duration_minutes,
            (SELECT max(score) FROM mock_exam_attempts a WHERE a.mock_exam_id = me.id AND a.user_id = $1 AND a.state = 'scored') AS best_score,
            (SELECT count(*)::int FROM mock_exam_attempts a WHERE a.mock_exam_id = me.id AND a.user_id = $1 AND a.state = 'scored') AS attempts
       FROM mock_exams me WHERE me.is_published ORDER BY me.hsk_level, me.duration_minutes`,
    [userId]
  );
}

export async function startAttempt(userId: string, mockExamId: string) {
  const me = await one<{ id: string }>(`SELECT id FROM mock_exams WHERE id = $1 AND is_published`, [mockExamId]);
  if (!me) throw new HskError(404, "not_found", "Mock exam not found");
  const a = await one<{ id: string }>(
    `INSERT INTO mock_exam_attempts (user_id, mock_exam_id, state) VALUES ($1, $2, 'in_progress') RETURNING id`,
    [userId, mockExamId]
  );
  return { attemptId: a!.id };
}

function shuffle<T>(arr: T[]): T[] { return arr.map((v) => [Math.random(), v] as [number, T]).sort((a, b) => a[0] - b[0]).map(([, v]) => v); }

export async function getAttempt(userId: string, attemptId: string) {
  const att = await one<{ id: string; mock_exam_id: string; state: string }>(
    `SELECT id, mock_exam_id, state FROM mock_exam_attempts WHERE id = $1 AND user_id = $2`,
    [attemptId, userId]
  );
  if (!att) throw new HskError(404, "not_found", "Attempt not found");
  const me = await one<{ hsk_level: number; title_key: string; duration_minutes: number; structure: any }>(
    `SELECT hsk_level, title_key, duration_minutes, structure FROM mock_exams WHERE id = $1`, [att.mock_exam_id]
  );
  const lang = await userLang(userId);
  const items = await query<{ id: string; hanzi: string; pinyin: string; gloss: string }>(
    `SELECT mi.id, mi.hanzi, mi.pinyin, COALESCE(g.gloss, ge.gloss) AS gloss
       FROM mandarin_items mi
       LEFT JOIN item_glosses g ON g.item_id = mi.id AND g.language_code = $2
       LEFT JOIN item_glosses ge ON ge.item_id = mi.id AND ge.language_code = 'en'
      WHERE mi.is_published AND mi.hsk_level <= $1`,
    [me!.hsk_level, lang]
  );
  const pool = items.map((i) => i.gloss);
  const sections: { name: string; count: number }[] = me!.structure?.sections || [{ name: "Reading", count: 6 }];

  const questions: any[] = [];
  for (const sec of sections) {
    const bag = shuffle(items);
    for (let i = 0; i < sec.count; i++) {
      const it = bag[i % bag.length];
      const distractors = shuffle(pool.filter((g) => g !== it.gloss)).slice(0, 3);
      const options = shuffle([it.gloss, ...distractors]);
      questions.push({ itemId: it.id, hanzi: it.hanzi, pinyin: it.pinyin, section: sec.name, options, answer: options.indexOf(it.gloss) });
    }
  }
  return { attemptId: att.id, level: me!.hsk_level, title: me!.title_key, durationMinutes: me!.duration_minutes, questions };
}

export async function submitAttempt(userId: string, attemptId: string, responses: { itemId: string; chosenGloss: string; section: string }[]) {
  const att = await one<{ id: string; state: string }>(`SELECT id, state FROM mock_exam_attempts WHERE id = $1 AND user_id = $2`, [attemptId, userId]);
  if (!att) throw new HskError(404, "not_found", "Attempt not found");
  if (att.state === "scored") throw new HskError(409, "already_scored", "Attempt already submitted");

  const lang = await userLang(userId);
  // Server-authoritative grading: compare each chosen gloss to the item's real gloss.
  const ids = Array.from(new Set(responses.map((r) => r.itemId)));
  const correctMap = new Map<string, string>();
  if (ids.length) {
    const rows = await query<{ id: string; gloss: string }>(
      `SELECT mi.id, COALESCE(g.gloss, ge.gloss) AS gloss FROM mandarin_items mi
         LEFT JOIN item_glosses g ON g.item_id = mi.id AND g.language_code = $2
         LEFT JOIN item_glosses ge ON ge.item_id = mi.id AND ge.language_code = 'en'
        WHERE mi.id = ANY($1::uuid[])`,
      [ids, lang]
    );
    rows.forEach((r) => correctMap.set(r.id, r.gloss));
  }
  const bySection: Record<string, { ok: number; n: number }> = {};
  let ok = 0;
  for (const r of responses) {
    const correct = correctMap.get(r.itemId) === r.chosenGloss;
    if (correct) ok++;
    const s = (bySection[r.section] ||= { ok: 0, n: 0 });
    s.n++; if (correct) s.ok++;
  }
  const total = responses.length || 1;
  const score = Math.round((ok / total) * 100);
  const sections = Object.entries(bySection).map(([name, v]) => ({ name, score: Math.round((v.ok / Math.max(1, v.n)) * 100) }));

  await query(
    `UPDATE mock_exam_attempts SET state = 'scored', score = $2, submitted_at = now(), answers = $3 WHERE id = $1`,
    [attemptId, score, JSON.stringify({ score, sections, count: total })]
  );

  // Snapshot readiness for the history chart.
  const plan = await activePlan(userId);
  if (plan) {
    const r = await computeReadiness(userId, plan.target_level);
    await query(`INSERT INTO readiness_scores (user_id, estimated_level, readiness_pct) VALUES ($1, $2, $3)`, [userId, r.estimatedLevel, r.readinessPct]);
  }
  return { score, sections };
}

// ---- study plans ----
export async function getActivePlan(userId: string) {
  const plan = await activePlan(userId);
  if (!plan) return { plan: null };
  const tasks = await query<any>(
    `SELECT id, due_date, description_key, lesson_id, is_done FROM study_plan_tasks WHERE study_plan_id = $1 ORDER BY due_date, id`,
    [plan.id]
  );
  return { plan: { id: plan.id, targetLevel: plan.target_level, examDate: plan.exam_date }, tasks };
}

export async function createPlan(userId: string, targetLevel: number, examDate: string | null) {
  if (targetLevel < 1 || targetLevel > 9) throw new HskError(400, "invalid_level", "targetLevel must be 1–9");
  await query(`UPDATE study_plans SET is_active = false WHERE user_id = $1 AND is_active`, [userId]);
  const plan = await one<{ id: string }>(
    `INSERT INTO study_plans (user_id, target_level, exam_date, is_active) VALUES ($1, $2, $3, true) RETURNING id`,
    [userId, targetLevel, examDate]
  );
  const tasks: [number, string][] = [
    [0, "Clear today's review queue"],
    [0, "Complete the next lesson in your path"],
    [1, "Learn 10 new words"],
    [2, "Listening drill — short dialogues"],
    [3, "Take a mock exam"],
    [5, "Review your weak areas"],
  ];
  for (const [offset, desc] of tasks) {
    await query(
      `INSERT INTO study_plan_tasks (study_plan_id, due_date, description_key, is_done) VALUES ($1, current_date + ($2::int), $3, false)`,
      [plan!.id, offset, desc]
    );
  }
  return { ok: true, planId: plan!.id };
}

export async function toggleTask(userId: string, taskId: string) {
  const row = await one<{ is_done: boolean }>(
    `UPDATE study_plan_tasks SET is_done = NOT is_done
      WHERE id = $1 AND study_plan_id IN (SELECT id FROM study_plans WHERE user_id = $2) RETURNING is_done`,
    [taskId, userId]
  );
  if (!row) throw new HskError(404, "not_found", "Task not found");
  return { isDone: row.is_done };
}
