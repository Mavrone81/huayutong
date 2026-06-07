// HSK 3.0 level explorer data ported from the design prototype.
export type SkillState = "req" | "new" | "off";
export type UnitTuple = [icon: string, name: string, words: string, count: number, progress: number];

export interface LevelData {
  stage: string; cum: number; nw: number; rec: number; hand: number; units: number;
  skills: Record<"listen" | "read" | "speak" | "write" | "hw", SkillState>;
  note: string;
  exam: [string, string][];
  you?: { words: string; chars: string; units: string; pct: number };
  unitsList: UnitTuple[];
}

export const LEVELS: Record<number, LevelData> = {
  1: { stage: "Elementary I", cum: 300, nw: 300, rec: 300, hand: 0, units: 6,
    skills: { listen: "req", read: "req", speak: "off", write: "off", hw: "off" },
    note: "HSK 1–2 test listening and reading only. Characters are recognition-only — no writing of any kind is required yet.",
    exam: [["Listening", "20 questions · 15 min"], ["Reading", "20 questions · 17 min"]],
    you: { words: "234 / 300", chars: "198 / 300", units: "2 / 6", pct: 78 },
    unitsList: [
      ["问", "Greetings & introductions", "你好 · 谢谢 · 再见 · 请问 · 对不起", 20, 100],
      ["数", "Numbers & time", "一 二 三 · 今天 · 明天 · 几点", 24, 100],
      ["家", "Family & people", "妈妈 · 爸爸 · 哥哥 · 妹妹 · 朋友", 26, 65],
      ["食", "Food & drink", "米饭 · 茶 · 水 · 苹果 · 菜", 28, 0],
      ["行", "Getting around", "出租车 · 飞机 · 火车站 · 路", 24, 0],
      ["买", "Shopping & money", "多少钱 · 块 · 商店 · 买", 22, 0]] },
  2: { stage: "Elementary II", cum: 500, nw: 200, rec: 600, hand: 0, units: 8,
    skills: { listen: "req", read: "req", speak: "off", write: "off", hw: "off" },
    note: "Still listening + reading only. Vocabulary doubles in practical, everyday domains; characters remain recognition-only.",
    exam: [["Listening", "≈25 questions · 20 min"], ["Reading", "≈25 questions · 22 min"]],
    unitsList: [
      ["日", "Daily routine", "起床 · 上班 · 睡觉 · 每天", 26, 0],
      ["天", "Weather & seasons", "下雨 · 晴天 · 冷 · 热", 22, 0],
      ["趣", "Hobbies & free time", "打篮球 · 唱歌 · 看电影", 24, 0],
      ["校", "School & work", "上课 · 考试 · 公司 · 同事", 28, 0],
      ["体", "Body & health", "医院 · 生病 · 吃药 · 休息", 24, 0],
      ["路", "Asking directions", "左边 · 右边 · 前面 · 离", 22, 0],
      ["物", "Shopping II", "便宜 · 贵 · 颜色 · 穿", 26, 0],
      ["游", "Travel basics", "旅游 · 宾馆 · 护照 · 票", 28, 0]] },
  3: { stage: "Elementary III", cum: 1000, nw: 500, rec: 900, hand: 0, units: 10,
    skills: { listen: "req", read: "req", speak: "new", write: "off", hw: "off" },
    note: "Speaking starts here: from HSK 3 every level includes a mandatory oral exam. MandaMix adds a Speaking Studio with pronunciation scoring. Still no writing.",
    exam: [["Listening", "≈30 questions · 25 min"], ["Reading", "≈30 questions · 27 min"], ["Oral exam (HSKK-style)", "recorded speaking tasks · NEW at this level"]],
    unitsList: [
      ["情", "Feelings & opinions", "高兴 · 难过 · 觉得 · 同意", 30, 0],
      ["比", "Comparing things", "比 · 最 · 更 · 一样", 26, 0],
      ["过", "Talking about the past", "过 · 了 · 已经 · 刚才", 28, 0],
      ["将", "Plans & the future", "打算 · 准备 · 会 · 要", 26, 0],
      ["说", "Speaking Studio I", "tone pairs · self-intro · daily topics", 0, 0],
      ["钱", "Money & banking", "银行 · 信用卡 · 花 · 借", 24, 0],
      ["节", "Festivals & culture", "春节 · 月饼 · 礼物 · 习惯", 28, 0],
      ["店", "Eating out", "点菜 · 服务员 · 账单 · 好吃", 26, 0],
      ["通", "Phones & internet", "手机 · 上网 · 发短信 · 邮件", 24, 0],
      ["说", "Speaking Studio II", "describing pictures · short narration", 0, 0]] },
  4: { stage: "Intermediate I", cum: 2000, nw: 1000, rec: 1200, hand: 0, units: 12,
    skills: { listen: "req", read: "req", speak: "req", write: "new", hw: "off" },
    note: "Writing starts here: HSK 4 adds a written-expression section (typed composition — sentence building and short passages). Handwriting is still not required.",
    exam: [["Listening", "≈40 questions · 30 min"], ["Reading", "≈35 questions · 35 min"], ["Writing (typed)", "sentence & short passage tasks · NEW at this level"], ["Oral exam", "intermediate speaking tasks"]],
    unitsList: [
      ["论", "Expressing opinions", "认为 · 看法 · 理由 · 讨论", 34, 0],
      ["商", "Business basics", "合同 · 会议 · 客户 · 谈判", 32, 0],
      ["闻", "News & media", "新闻 · 报道 · 记者 · 采访", 30, 0],
      ["社", "Society & life", "环境 · 交通 · 人口 · 变化", 32, 0],
      ["把", "把 & 被 structures", "把 · 被 · 让 · 使", 26, 0],
      ["文", "Writing Workshop I", "connectors · sentence order · short essays", 0, 0],
      ["职", "Careers & interviews", "简历 · 面试 · 经验 · 能力", 30, 0],
      ["学", "Study & exams", "复习 · 成绩 · 压力 · 方法", 28, 0],
      ["情", "Relationships", "感情 · 结婚 · 邻居 · 信任", 30, 0],
      ["康", "Health & lifestyle", "锻炼 · 习惯 · 营养 · 放松", 28, 0],
      ["说", "Speaking Studio III", "opinions · comparisons · stories", 0, 0],
      ["文", "Writing Workshop II", "complaint email · short narrative", 0, 0]] },
  5: { stage: "Intermediate II", cum: 3600, nw: 1600, rec: 1500, hand: 150, units: 14,
    skills: { listen: "req", read: "req", speak: "req", write: "req", hw: "new" },
    note: "Handwriting starts here: HSK 5 requires writing ≈150 characters by hand. The Writing Studio adds stroke-by-stroke handwriting drills alongside essay work.",
    exam: [["Listening", "≈45 questions · 30 min"], ["Reading", "≈40 questions · 40 min"], ["Writing", "essay + handwritten characters (≈150 chars) · handwriting NEW"], ["Oral exam", "upper-intermediate speaking"]],
    unitsList: [
      ["写", "Handwriting Studio I", "first 75 written characters · stroke drills", 0, 0],
      ["章", "Essay writing", "structure · argument · 80-character essays", 0, 0],
      ["抽", "Abstract topics", "观念 · 价值 · 现象 · 影响", 38, 0],
      ["史", "History & culture", "朝代 · 传统 · 发展 · 文明", 36, 0],
      ["学", "Academic Chinese", "研究 · 数据 · 结论 · 理论", 36, 0],
      ["演", "Presentations", "汇报 · 图表 · 总结 · 建议", 32, 0],
      ["写", "Handwriting Studio II", "next 75 written characters", 0, 0],
      ["经", "Economy & trade", "经济 · 市场 · 出口 · 增长", 36, 0],
      ["科", "Science & tech", "科技 · 人工智能 · 发明", 34, 0],
      ["法", "Rules & law", "法律 · 规定 · 权利 · 责任", 32, 0],
      ["章", "Essay Workshop II", "narrative & opinion essays", 0, 0],
      ["境", "Environment", "污染 · 保护 · 气候 · 资源", 34, 0],
      ["艺", "Arts & literature", "小说 · 诗歌 · 艺术 · 表演", 32, 0],
      ["说", "Speaking Studio IV", "debate basics · describing trends", 0, 0]] },
  6: { stage: "Intermediate III", cum: 5400, nw: 1800, rec: 1800, hand: 300, units: 16,
    skills: { listen: "req", read: "req", speak: "req", write: "req", hw: "req" },
    note: "Full skill set: long listening passages, fast reading, essay writing with ≈300 handwritten characters, and an advanced oral exam. Completing HSK 6 prepares you for the 7–9 band.",
    exam: [["Listening", "long dialogues & passages · ≈35 min"], ["Reading", "editorials & literature excerpts · ≈45 min"], ["Writing", "summary + essay · ≈300 handwritten chars"], ["Oral exam", "advanced discussion & argument"]],
    unitsList: [
      ["笔", "Handwriting Studio III", "to 300 written characters", 0, 0],
      ["评", "Editorials & argument", "社论 · 立场 · 论证 · 反驳", 40, 0],
      ["报", "Reports & summaries", "摘要 · 概括 · 引用 · 分析", 38, 0],
      ["成", "Chengyu & idioms", "成语 · 俗语 · 比喻", 36, 0],
      ["演", "Debate & discourse", "辩论 · 观点 · 逻辑 · 反方", 34, 0],
      ["译", "Toward HSK 7–9", "translation taster · formal registers", 0, 0],
      ["政", "Politics & society", "政策 · 改革 · 制度 · 舆论", 38, 0],
      ["商", "Advanced business", "投资 · 股份 · 战略 · 竞争", 38, 0],
      ["哲", "Ideas & philosophy", "哲学 · 道德 · 思想 · 信仰", 36, 0],
      ["医", "Medicine & science", "诊断 · 治疗 · 实验 · 基因", 36, 0],
      ["文", "Literature", "鲁迅 · 散文 · 名著选读", 34, 0],
      ["章", "Essay mastery", "长文写作 · 文体 · 修辞", 0, 0],
      ["闻", "Current affairs", "时事 · 国际 · 经贸 · 环保", 36, 0],
      ["说", "Speaking Studio V", "presentations · storytelling · humor", 0, 0],
      ["读", "Speed-reading lab", "skimming · scanning · timed drills", 0, 0],
      ["考", "Exam bootcamp", "full mocks · pacing · error review", 0, 0]] },
};

export const SKILL_META: [string, string, string][] = [
  ["listen", "听", "Listening"], ["read", "读", "Reading"], ["speak", "说", "Speaking"],
  ["write", "写", "Writing (typed)"], ["hw", "✍", "Handwriting"]];

export const SKILL_SUB: Record<string, Record<string, string>> = {
  listen: { req: "Tested at this level", off: "—" },
  read: { req: "Tested at this level", off: "—" },
  speak: { req: "Oral exam required", new: "STARTS HERE · oral exam from HSK 3", off: "Not tested until HSK 3" },
  write: { req: "Written section required", new: "STARTS HERE · typed composition", off: "Not tested until HSK 4" },
  hw: { req: "≈300 chars by hand", new: "STARTS HERE · ≈150 chars by hand", off: "Not required until HSK 5" },
};
