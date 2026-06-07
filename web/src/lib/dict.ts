// Real 4-language dictionary ported from the design prototype.
// Keys map to UI strings; components fall back to English then to a literal.

export type Lang = "en" | "th" | "vi" | "ms";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "🌐 English" },
  { code: "th", label: "🌐 ไทย" },
  { code: "vi", label: "🌐 Tiếng Việt" },
  { code: "ms", label: "🌐 Bahasa Melayu" },
];

// Lesson-1 listening answers per language (real translations)
export const EX1: Record<Lang, string[]> = {
  en: ["younger brother", "younger sister", "older sister", "mom"],
  th: ["น้องชาย", "น้องสาว", "พี่สาว", "คุณแม่"],
  vi: ["em trai", "em gái", "chị gái", "mẹ"],
  ms: ["adik lelaki", "adik perempuan", "kakak", "ibu"],
};

export const SB_PROMPT: Record<Lang, string> = {
  en: '"I have one younger sister"',
  th: '"ฉันมีน้องสาวหนึ่งคน"',
  vi: '"Tôi có một em gái"',
  ms: '"Saya ada seorang adik perempuan"',
};

export const T: Record<Lang, Record<string, string>> = {
  en: {
    trial_cta: "Start 1-month free trial", login: "Log in",
    hero_h1: "Learn Mandarin <em>in your own language.</em>",
    hero_p: "The first self-paced Mandarin course taught natively in Thai, Vietnamese, Bahasa Melayu and English — with a clear path from zero to HSK certification.",
    hero_chip: "✦ Aligned to the new HSK 3.0 standard", hero_note: "Full premium access · cancel anytime before the month ends",
    nav_learn: "Learn", nav_review: "Review", nav_hskprep: "HSK Prep", nav_account: "Account", nav_courses2: "Courses", nav_settings: "Settings", nav_write: "Writing",
    dash_h1: "Good morning, Ploy 👋", dash_p: "You're 78% of the way to HSK 1. Keep it going.", dash_cta: "▶ Continue lesson",
    st1: "Today's goal", st2: "Streak", st3: "Reviews due", continue: "Continue →", check: "Check", next: "Next →", reset: "Reset",
    reg_h: "Create your account", reg_cta: "Create account →", reg_email: "Email or phone", reg_pass: "Password", reg_have: "Already have an account?",
    li_h: "Welcome back", li_cta: "Log in →", sb_hint: "Tap the tiles in order",
    fb_ok: "✓ Correct! 妹妹 (mèimei) = younger sister", fb_no: "✗ Not quite — 妹妹 means younger sister",
    fb2_ok: "✓ Right — 妈 mā is Tone 1, flat and high (mom!)", fb2_no: "✗ Listen again — 妈 mā is Tone 1, flat and high",
    fb3_ok: "✓ Perfect! 我有一个妹妹 — wǒ yǒu yí gè mèimei", fb3_no: "✗ Word order: 我 (I) + 有 (have) + 一个 (one) + 妹妹 (younger sister)",
    fb4_ok: "✓ All matched! 爸爸 bàba · 姐姐 jiějie · 哥哥 gēge · 弟弟 dìdi",
    canceled: "Canceled", tb_h_c: "Trial canceled — access until 6 July", tb_p_c: "You will not be charged. You can resubscribe anytime to keep Premium after 6 July.",
  },
  th: {
    trial_cta: "เริ่มทดลองฟรี 1 เดือน", login: "เข้าสู่ระบบ",
    hero_h1: "เรียนภาษาจีน <em>ในภาษาของคุณเอง</em>",
    hero_p: "คอร์สภาษาจีนแบบเรียนด้วยตนเองคอร์สแรกที่สอนเป็นภาษาไทย เวียดนาม มลายู และอังกฤษ พร้อมเส้นทางชัดเจนสู่การสอบ HSK",
    hero_chip: "✦ สอดคล้องกับมาตรฐาน HSK 3.0 ใหม่", hero_note: "ใช้พรีเมียมเต็มรูปแบบ · ยกเลิกได้ทุกเมื่อก่อนสิ้นเดือน",
    nav_learn: "เรียน", nav_review: "ทบทวน", nav_hskprep: "เตรียมสอบ HSK", nav_account: "บัญชี", nav_courses2: "คอร์ส", nav_settings: "ตั้งค่า", nav_write: "การเขียน",
    dash_h1: "สวัสดีตอนเช้า พลอย 👋", dash_p: "คุณมาถึง 78% ของ HSK 1 แล้ว สู้ต่อไป!", dash_cta: "▶ เรียนต่อ",
    st1: "เป้าหมายวันนี้", st2: "สตรีค", st3: "รอทบทวน", continue: "ต่อไป →", check: "ตรวจคำตอบ", next: "ต่อไป →", reset: "เริ่มใหม่",
    reg_h: "สร้างบัญชีของคุณ", reg_cta: "สร้างบัญชี →", reg_email: "อีเมลหรือเบอร์โทร", reg_pass: "รหัสผ่าน", reg_have: "มีบัญชีอยู่แล้ว?",
    li_h: "ยินดีต้อนรับกลับ", li_cta: "เข้าสู่ระบบ →", sb_hint: "แตะคำตามลำดับ",
    fb_ok: "✓ ถูกต้อง! 妹妹 (mèimei) = น้องสาว", fb_no: "✗ ยังไม่ใช่ — 妹妹 แปลว่า น้องสาว",
    fb2_ok: "✓ ถูกต้อง — 妈 mā คือเสียงที่ 1 เสียงสูงราบ (แม่!)", fb2_no: "✗ ฟังอีกครั้ง — 妈 mā คือเสียงที่ 1 เสียงสูงราบ",
    fb3_ok: "✓ เยี่ยม! 我有一个妹妹 — ฉันมีน้องสาวหนึ่งคน", fb3_no: "✗ ลำดับคำ: 我 (ฉัน) + 有 (มี) + 一个 (หนึ่ง) + 妹妹 (น้องสาว)",
    fb4_ok: "✓ จับคู่ครบ! 爸爸 พ่อ · 姐姐 พี่สาว · 哥哥 พี่ชาย · 弟弟 น้องชาย",
    canceled: "ยกเลิกแล้ว", tb_h_c: "ยกเลิกการทดลองแล้ว — ใช้ได้ถึง 6 ก.ค.", tb_p_c: "คุณจะไม่ถูกเรียกเก็บเงิน สมัครใหม่ได้ทุกเมื่อ",
  },
  vi: {
    trial_cta: "Dùng thử miễn phí 1 tháng", login: "Đăng nhập",
    hero_h1: "Học tiếng Trung <em>bằng ngôn ngữ của bạn.</em>",
    hero_p: "Khóa học tiếng Trung tự học đầu tiên được dạy hoàn toàn bằng tiếng Việt, Thái, Mã Lai và Anh — với lộ trình rõ ràng từ con số 0 đến chứng chỉ HSK.",
    hero_chip: "✦ Theo chuẩn HSK 3.0 mới", hero_note: "Truy cập premium đầy đủ · hủy bất cứ lúc nào trước khi hết tháng",
    nav_learn: "Học", nav_review: "Ôn tập", nav_hskprep: "Luyện HSK", nav_account: "Tài khoản", nav_courses2: "Khóa học", nav_settings: "Cài đặt", nav_write: "Viết",
    dash_h1: "Chào buổi sáng, Ploy 👋", dash_p: "Bạn đã hoàn thành 78% HSK 1. Cố lên!", dash_cta: "▶ Tiếp tục bài học",
    st1: "Mục tiêu hôm nay", st2: "Chuỗi ngày", st3: "Cần ôn tập", continue: "Tiếp tục →", check: "Kiểm tra", next: "Tiếp →", reset: "Làm lại",
    reg_h: "Tạo tài khoản của bạn", reg_cta: "Tạo tài khoản →", reg_email: "Email hoặc số điện thoại", reg_pass: "Mật khẩu", reg_have: "Đã có tài khoản?",
    li_h: "Chào mừng trở lại", li_cta: "Đăng nhập →", sb_hint: "Chạm các thẻ theo thứ tự",
    fb_ok: "✓ Chính xác! 妹妹 (mèimei) = em gái", fb_no: "✗ Chưa đúng — 妹妹 nghĩa là em gái",
    fb2_ok: "✓ Đúng — 妈 mā là thanh 1, cao và bằng (mẹ!)", fb2_no: "✗ Nghe lại — 妈 mā là thanh 1, cao và bằng",
    fb3_ok: "✓ Tuyệt! 我有一个妹妹 — Tôi có một em gái", fb3_no: "✗ Trật tự từ: 我 (tôi) + 有 (có) + 一个 (một) + 妹妹 (em gái)",
    fb4_ok: "✓ Ghép đúng hết! 爸爸 bố · 姐姐 chị gái · 哥哥 anh trai · 弟弟 em trai",
    canceled: "Đã hủy", tb_h_c: "Đã hủy dùng thử — truy cập đến 6/7", tb_p_c: "Bạn sẽ không bị tính phí. Đăng ký lại bất cứ lúc nào.",
  },
  ms: {
    trial_cta: "Mula percubaan percuma 1 bulan", login: "Log masuk",
    hero_h1: "Belajar Mandarin <em>dalam bahasa anda sendiri.</em>",
    hero_p: "Kursus Mandarin kadar kendiri pertama yang diajar secara asli dalam Bahasa Melayu, Thai, Vietnam dan Inggeris — dengan laluan jelas dari sifar ke pensijilan HSK.",
    hero_chip: "✦ Selaras dengan standard HSK 3.0 baharu", hero_note: "Akses premium penuh · batal bila-bila masa sebelum bulan berakhir",
    nav_learn: "Belajar", nav_review: "Ulang kaji", nav_hskprep: "Persediaan HSK", nav_account: "Akaun", nav_courses2: "Kursus", nav_settings: "Tetapan", nav_write: "Menulis",
    dash_h1: "Selamat pagi, Ploy 👋", dash_p: "Anda sudah 78% menuju HSK 1. Teruskan!", dash_cta: "▶ Sambung pelajaran",
    st1: "Sasaran hari ini", st2: "Streak", st3: "Perlu ulang kaji", continue: "Teruskan →", check: "Semak", next: "Seterusnya →", reset: "Set semula",
    reg_h: "Cipta akaun anda", reg_cta: "Cipta akaun →", reg_email: "E-mel atau telefon", reg_pass: "Kata laluan", reg_have: "Sudah ada akaun?",
    li_h: "Selamat kembali", li_cta: "Log masuk →", sb_hint: "Ketik jubin mengikut urutan",
    fb_ok: "✓ Betul! 妹妹 (mèimei) = adik perempuan", fb_no: "✗ Belum tepat — 妹妹 bermaksud adik perempuan",
    fb2_ok: "✓ Betul — 妈 mā ialah nada 1, tinggi dan rata (ibu!)", fb2_no: "✗ Dengar semula — 妈 mā ialah nada 1, tinggi dan rata",
    fb3_ok: "✓ Hebat! 我有一个妹妹 — Saya ada seorang adik perempuan", fb3_no: "✗ Susunan kata: 我 (saya) + 有 (ada) + 一个 (seorang) + 妹妹 (adik perempuan)",
    fb4_ok: "✓ Semua padan! 爸爸 ayah · 姐姐 kakak · 哥哥 abang · 弟弟 adik lelaki",
    canceled: "Dibatalkan", tb_h_c: "Percubaan dibatalkan — akses hingga 6 Julai", tb_p_c: "Anda tidak akan dicaj. Langgan semula bila-bila masa.",
  },
};
