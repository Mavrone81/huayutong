import { query, one } from "./db";
import { getEntitlement } from "./entitlement";

export class LearnError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function userLang(userId: string): Promise<string> {
  const u = await one<{ ui_language: string }>(`SELECT ui_language FROM users WHERE id = $1`, [userId]);
  return u?.ui_language || "en";
}

/** Enroll a user in HSK 1 and ensure streak / daily-goal rows exist. */
export async function ensureEnrollment(userId: string) {
  const course = await one<{ id: string }>(`SELECT id FROM courses WHERE hsk_level = 1 LIMIT 1`);
  if (course) {
    await query(`INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [userId, course.id]);
  }
  await query(`INSERT INTO streaks (user_id, current_count, longest_count) VALUES ($1, 0, 0) ON CONFLICT (user_id) DO NOTHING`, [userId]);
  await query(
    `INSERT INTO daily_goals (user_id, goal_date, target_minutes, completed_minutes, met)
     VALUES ($1, current_date, 10, 0, false) ON CONFLICT (user_id, goal_date) DO NOTHING`,
    [userId]
  );
}

const dueLabel = (d: string): string => {
  const ms = new Date(d).getTime() - Date.now();
  if (ms <= 0) return "due now";
  const h = Math.round(ms / 3600000);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
};

export async function dashboardProgress(userId: string) {
  await ensureEnrollment(userId);
  const lang = await userLang(userId);
  const ent = await getEntitlement(userId);
  const premium = ent.tier === "premium";

  const xp = (await one<{ xp: number }>(`SELECT COALESCE(SUM(amount),0)::int AS xp FROM xp_ledger WHERE user_id = $1`, [userId]))!.xp;
  const streak = (await one<{ current_count: number; longest_count: number }>(`SELECT current_count, longest_count FROM streaks WHERE user_id = $1`, [userId])) || { current_count: 0, longest_count: 0 };
  const reviewsDue = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM srs_cards WHERE user_id = $1 AND due_at <= now()`, [userId]))!.n;
  const goal = (await one<{ target_minutes: number; completed_minutes: number }>(`SELECT target_minutes, completed_minutes FROM daily_goals WHERE user_id = $1 AND goal_date = current_date`, [userId])) || { target_minutes: 10, completed_minutes: 0 };

  const skills = await query<{ icon: string; title: string; lesson_id: string; is_premium: boolean; total_items: number; learned_items: number; completed: boolean; preview: string }>(
    `SELECT s.icon, s.title_key AS title, l.id AS lesson_id, l.is_premium,
            (SELECT count(*) FROM lesson_items li WHERE li.lesson_id = l.id)::int AS total_items,
            (SELECT count(*) FROM lesson_items li JOIN srs_cards sc ON sc.item_id = li.item_id AND sc.user_id = $1 WHERE li.lesson_id = l.id)::int AS learned_items,
            EXISTS(SELECT 1 FROM lesson_progress lp WHERE lp.user_id = $1 AND lp.lesson_id = l.id AND lp.state = 'completed') AS completed,
            (SELECT string_agg(hanzi, ' · ') FROM (SELECT mi.hanzi FROM lesson_items li JOIN mandarin_items mi ON mi.id = li.item_id WHERE li.lesson_id = l.id ORDER BY li.sort_order LIMIT 4) q) AS preview
       FROM skills s JOIN lessons l ON l.skill_id = s.id JOIN courses c ON c.id = s.course_id
      WHERE c.hsk_level = 1 ORDER BY s.sort_order`,
    [userId]
  );

  let nextLessonId: string | null = null;
  const skillDTO = skills.map((s) => {
    const locked = s.is_premium && !premium;
    const state = locked ? "locked" : s.completed ? "done" : "active";
    if (!nextLessonId && !locked && !s.completed) nextLessonId = s.lesson_id;
    const pct = s.completed ? 100 : s.total_items ? Math.round((s.learned_items / s.total_items) * 100) : 0;
    const color = state === "done" ? "var(--teal)" : state === "active" ? "var(--navy-2)" : "#B6C3D2";
    return {
      hanzi: s.icon, title: s.title, lessonId: s.lesson_id,
      sub: `${s.learned_items}/${s.total_items} words · ${s.preview || ""}`,
      progress: pct, state, color,
    };
  });

  const totalItems = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM mandarin_items WHERE hsk_level = 1`))!.n;
  const learned = (await one<{ n: number }>(`SELECT count(DISTINCT sc.item_id)::int AS n FROM srs_cards sc JOIN mandarin_items mi ON mi.id = sc.item_id WHERE sc.user_id = $1 AND mi.hsk_level = 1`, [userId]))!.n;

  const srs = (await query<{ hanzi: string; pinyin: string; gloss: string; due_at: string }>(
    `SELECT mi.hanzi, mi.pinyin, COALESCE(g.gloss, ge.gloss) AS gloss, sc.due_at
       FROM srs_cards sc JOIN mandarin_items mi ON mi.id = sc.item_id
       LEFT JOIN item_glosses g ON g.item_id = mi.id AND g.language_code = $2
       LEFT JOIN item_glosses ge ON ge.item_id = mi.id AND ge.language_code = 'en'
      WHERE sc.user_id = $1 ORDER BY sc.due_at LIMIT 8`,
    [userId, lang]
  )).map((r) => ({ hanzi: r.hanzi, gloss: `${r.pinyin} · ${r.gloss}`, due: dueLabel(r.due_at) }));

  return {
    xp, streak: streak.current_count, longestStreak: streak.longest_count,
    reviewsDue, goalMinutes: goal.target_minutes, goalDone: goal.completed_minutes,
    hsk1Readiness: totalItems ? Math.round((learned / totalItems) * 100) : 0,
    nextLessonId, skills: skillDTO, srs,
  };
}

export async function getLessonForUser(userId: string, lessonId: string) {
  const lesson = await one<{ id: string; title: string; icon: string; is_premium: boolean }>(
    `SELECT l.id, s.title_key AS title, s.icon, l.is_premium FROM lessons l JOIN skills s ON s.id = l.skill_id WHERE l.id = $1`,
    [lessonId]
  );
  if (!lesson) throw new LearnError(404, "not_found", "Lesson not found");
  const ent = await getEntitlement(userId);
  if (lesson.is_premium && ent.tier !== "premium") throw new LearnError(402, "locked", "This lesson requires Premium");

  const lang = await userLang(userId);
  const items = await query<{ id: string; hanzi: string; pinyin: string; audio_url: string | null; gloss: string }>(
    `SELECT mi.id, mi.hanzi, mi.pinyin, mi.audio_url, COALESCE(g.gloss, ge.gloss) AS gloss
       FROM lesson_items li JOIN mandarin_items mi ON mi.id = li.item_id
       LEFT JOIN item_glosses g ON g.item_id = mi.id AND g.language_code = $2
       LEFT JOIN item_glosses ge ON ge.item_id = mi.id AND ge.language_code = 'en'
      WHERE li.lesson_id = $1 ORDER BY li.sort_order`,
    [lessonId, lang]
  );
  const pool = items.map((i) => i.gloss);

  const built = items.map((it) => {
    const distractors = pool.filter((g) => g !== it.gloss).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [it.gloss, ...distractors].sort(() => Math.random() - 0.5);
    return { id: it.id, hanzi: it.hanzi, pinyin: it.pinyin, audioUrl: it.audio_url, gloss: it.gloss, options, answer: options.indexOf(it.gloss) };
  });

  return { id: lesson.id, title: lesson.title, icon: lesson.icon, items: built };
}

export async function completeLesson(userId: string, lessonId: string, score = 100) {
  const lesson = await one<{ id: string; is_premium: boolean; est_minutes: number }>(`SELECT id, is_premium, est_minutes FROM lessons WHERE id = $1`, [lessonId]);
  if (!lesson) throw new LearnError(404, "not_found", "Lesson not found");
  const ent = await getEntitlement(userId);
  if (lesson.is_premium && ent.tier !== "premium") throw new LearnError(402, "locked", "This lesson requires Premium");

  const prev = await one<{ state: string }>(`SELECT state FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2`, [userId, lessonId]);
  const firstTime = !prev || prev.state !== "completed";

  await query(
    `INSERT INTO lesson_progress (user_id, lesson_id, state, score, completed_at)
     VALUES ($1, $2, 'completed', $3, now())
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET state = 'completed', score = EXCLUDED.score, completed_at = now(), updated_at = now()`,
    [userId, lessonId, score]
  );

  // Seed SRS cards for this lesson's items.
  await query(
    `INSERT INTO srs_cards (user_id, item_id, due_at)
     SELECT $1, li.item_id, now() FROM lesson_items li WHERE li.lesson_id = $2
     ON CONFLICT (user_id, item_id) DO NOTHING`,
    [userId, lessonId]
  );

  let xpAwarded = 0;
  if (firstTime) {
    xpAwarded = 25;
    await query(`INSERT INTO xp_ledger (user_id, amount, reason) VALUES ($1, $2, 'lesson_complete')`, [userId, xpAwarded]);
    await query(
      `INSERT INTO streaks (user_id, current_count, longest_count, last_active_date)
       VALUES ($1, 1, 1, current_date)
       ON CONFLICT (user_id) DO UPDATE SET
         current_count = CASE WHEN streaks.last_active_date = current_date THEN streaks.current_count
                              WHEN streaks.last_active_date = current_date - 1 THEN streaks.current_count + 1
                              ELSE 1 END,
         longest_count = GREATEST(streaks.longest_count,
                          CASE WHEN streaks.last_active_date = current_date THEN streaks.current_count
                               WHEN streaks.last_active_date = current_date - 1 THEN streaks.current_count + 1
                               ELSE 1 END),
         last_active_date = current_date`,
      [userId]
    );
  }
  await query(
    `INSERT INTO daily_goals (user_id, goal_date, target_minutes, completed_minutes, met)
     VALUES ($1, current_date, 10, $2, $2 >= 10)
     ON CONFLICT (user_id, goal_date) DO UPDATE SET completed_minutes = daily_goals.completed_minutes + $2,
       met = (daily_goals.completed_minutes + $2) >= daily_goals.target_minutes`,
    [userId, lesson.est_minutes]
  );

  const streak = (await one<{ current_count: number }>(`SELECT current_count FROM streaks WHERE user_id = $1`, [userId]))!.current_count;
  return { xpAwarded, streak, accuracy: score };
}

export async function srsQueue(userId: string) {
  const lang = await userLang(userId);
  const rows = await query<{ id: string; hanzi: string; pinyin: string; gloss: string; due_at: string }>(
    `SELECT sc.id, mi.hanzi, mi.pinyin, COALESCE(g.gloss, ge.gloss) AS gloss, sc.due_at
       FROM srs_cards sc JOIN mandarin_items mi ON mi.id = sc.item_id
       LEFT JOIN item_glosses g ON g.item_id = mi.id AND g.language_code = $2
       LEFT JOIN item_glosses ge ON ge.item_id = mi.id AND ge.language_code = 'en'
      WHERE sc.user_id = $1 AND sc.due_at <= now() ORDER BY sc.due_at LIMIT 50`,
    [userId, lang]
  );
  return rows.map((r) => ({ cardId: r.id, hanzi: r.hanzi, pinyin: r.pinyin, gloss: r.gloss }));
}

export async function reviewCard(userId: string, cardId: string, grade: number) {
  const card = await one<{ id: string; ease: number; interval_days: number; reps: number; lapses: number }>(
    `SELECT id, ease, interval_days, reps, lapses FROM srs_cards WHERE id = $1 AND user_id = $2`,
    [cardId, userId]
  );
  if (!card) throw new LearnError(404, "not_found", "Card not found");
  let { ease, interval_days: interval, reps, lapses } = card;
  ease = Number(ease);

  if (grade < 3) {
    reps = 0; interval = 1; lapses += 1; ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(interval * ease);
    ease = Math.min(2.8, Math.max(1.3, ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))));
  }
  await query(
    `UPDATE srs_cards SET ease = $2, interval_days = $6, reps = $4, lapses = $5, last_reviewed_at = now(), due_at = now() + make_interval(days => $3) WHERE id = $1`,
    [cardId, ease.toFixed(2), interval, reps, lapses, interval]
  );
  await query(`INSERT INTO srs_reviews (card_id, grade) VALUES ($1, $2)`, [cardId, grade]);
  return { intervalDays: interval, reps };
}

export async function setDailyGoal(userId: string, minutes: number) {
  await query(
    `INSERT INTO daily_goals (user_id, goal_date, target_minutes, completed_minutes, met)
     VALUES ($1, current_date, $2, 0, false)
     ON CONFLICT (user_id, goal_date) DO UPDATE SET target_minutes = $2, met = daily_goals.completed_minutes >= $2`,
    [userId, minutes]
  );
  return { targetMinutes: minutes };
}

export async function courseTree(userId: string) {
  await ensureEnrollment(userId);
  const ent = await getEntitlement(userId);
  const premium = ent.tier === "premium";
  const skills = await query<{ id: string; icon: string; title: string; lesson_id: string; is_premium: boolean; total_items: number; completed: boolean }>(
    `SELECT s.id, s.icon, s.title_key AS title, l.id AS lesson_id, l.is_premium,
            (SELECT count(*) FROM lesson_items li WHERE li.lesson_id = l.id)::int AS total_items,
            EXISTS(SELECT 1 FROM lesson_progress lp WHERE lp.user_id = $1 AND lp.lesson_id = l.id AND lp.state='completed') AS completed
       FROM skills s JOIN lessons l ON l.skill_id = s.id JOIN courses c ON c.id = s.course_id
      WHERE c.hsk_level = 1 ORDER BY s.sort_order`,
    [userId]
  );
  return {
    level: 1,
    skills: skills.map((s) => ({
      icon: s.icon, title: s.title, lessonId: s.lesson_id, items: s.total_items,
      locked: s.is_premium && !premium, completed: s.completed,
    })),
  };
}
