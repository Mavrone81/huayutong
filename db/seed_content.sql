-- HSK 1 learning content (skills, lessons, items, 4-language glosses).
-- Idempotent: the DO block no-ops if HSK 1 content already exists.
ALTER TABLE skills ADD COLUMN IF NOT EXISTS icon text;

DO $$
DECLARE c_id uuid; s_id uuid; l_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM courses WHERE hsk_level = 1) THEN RETURN; END IF;

  INSERT INTO courses (hsk_level, title_key, sort_order, is_published)
    VALUES (1, 'HSK 1', 1, true) RETURNING id INTO c_id;

  -- 1. Greetings & introductions (free)
  INSERT INTO skills (course_id, title_key, icon, sort_order) VALUES (c_id, 'Greetings & introductions', '问', 1) RETURNING id INTO s_id;
  INSERT INTO lessons (skill_id, title_key, lesson_type, sort_order, est_minutes, is_premium) VALUES (s_id, 'Greetings & introductions', 'vocab', 1, 7, false) RETURNING id INTO l_id;
  INSERT INTO mandarin_items (hanzi, pinyin, hsk_level, part_of_speech, is_published) VALUES
    ('你好','nǐ hǎo',1,'phrase',true),('谢谢','xièxie',1,'phrase',true),('再见','zàijiàn',1,'phrase',true),('请问','qǐngwèn',1,'phrase',true),('对不起','duìbuqǐ',1,'phrase',true);
  INSERT INTO lesson_items (lesson_id, item_id) SELECT l_id, id FROM mandarin_items WHERE hanzi = ANY(ARRAY['你好','谢谢','再见','请问','对不起']);

  -- 2. Numbers & time (free)
  INSERT INTO skills (course_id, title_key, icon, sort_order) VALUES (c_id, 'Numbers & time', '数', 2) RETURNING id INTO s_id;
  INSERT INTO lessons (skill_id, title_key, lesson_type, sort_order, est_minutes, is_premium) VALUES (s_id, 'Numbers & time', 'vocab', 1, 7, false) RETURNING id INTO l_id;
  INSERT INTO mandarin_items (hanzi, pinyin, hsk_level, part_of_speech, is_published) VALUES
    ('一','yī',1,'num',true),('二','èr',1,'num',true),('三','sān',1,'num',true),('今天','jīntiān',1,'noun',true),('现在','xiànzài',1,'noun',true);
  INSERT INTO lesson_items (lesson_id, item_id) SELECT l_id, id FROM mandarin_items WHERE hanzi = ANY(ARRAY['一','二','三','今天','现在']);

  -- 3. Family & people (premium)
  INSERT INTO skills (course_id, title_key, icon, sort_order) VALUES (c_id, 'Family & people', '家', 3) RETURNING id INTO s_id;
  INSERT INTO lessons (skill_id, title_key, lesson_type, sort_order, est_minutes, is_premium) VALUES (s_id, 'Family & people', 'vocab', 1, 7, true) RETURNING id INTO l_id;
  INSERT INTO mandarin_items (hanzi, pinyin, hsk_level, part_of_speech, is_published) VALUES
    ('妈妈','māma',1,'noun',true),('爸爸','bàba',1,'noun',true),('哥哥','gēge',1,'noun',true),('妹妹','mèimei',1,'noun',true),('姐姐','jiějie',1,'noun',true),('弟弟','dìdi',1,'noun',true);
  INSERT INTO lesson_items (lesson_id, item_id) SELECT l_id, id FROM mandarin_items WHERE hanzi = ANY(ARRAY['妈妈','爸爸','哥哥','妹妹','姐姐','弟弟']);

  -- 4. Food & drink (premium)
  INSERT INTO skills (course_id, title_key, icon, sort_order) VALUES (c_id, 'Food & drink', '食', 4) RETURNING id INTO s_id;
  INSERT INTO lessons (skill_id, title_key, lesson_type, sort_order, est_minutes, is_premium) VALUES (s_id, 'Food & drink', 'vocab', 1, 7, true) RETURNING id INTO l_id;
  INSERT INTO mandarin_items (hanzi, pinyin, hsk_level, part_of_speech, is_published) VALUES
    ('米饭','mǐfàn',1,'noun',true),('茶','chá',1,'noun',true),('水','shuǐ',1,'noun',true),('苹果','píngguǒ',1,'noun',true);
  INSERT INTO lesson_items (lesson_id, item_id) SELECT l_id, id FROM mandarin_items WHERE hanzi = ANY(ARRAY['米饭','茶','水','苹果']);

  -- 5. Getting around (premium)
  INSERT INTO skills (course_id, title_key, icon, sort_order) VALUES (c_id, 'Getting around', '行', 5) RETURNING id INTO s_id;
  INSERT INTO lessons (skill_id, title_key, lesson_type, sort_order, est_minutes, is_premium) VALUES (s_id, 'Getting around', 'vocab', 1, 7, true) RETURNING id INTO l_id;
  INSERT INTO mandarin_items (hanzi, pinyin, hsk_level, part_of_speech, is_published) VALUES
    ('出租车','chūzūchē',1,'noun',true),('飞机','fēijī',1,'noun',true),('火车站','huǒchēzhàn',1,'noun',true);
  INSERT INTO lesson_items (lesson_id, item_id) SELECT l_id, id FROM mandarin_items WHERE hanzi = ANY(ARRAY['出租车','飞机','火车站']);

  -- Glosses (EN / TH / VI / MS) for every item
  INSERT INTO item_glosses (item_id, language_code, gloss)
  SELECT mi.id, g.lang, g.gloss
  FROM mandarin_items mi
  JOIN (VALUES
    ('你好','en','hello'),('你好','th','สวัสดี'),('你好','vi','xin chào'),('你好','ms','helo'),
    ('谢谢','en','thank you'),('谢谢','th','ขอบคุณ'),('谢谢','vi','cảm ơn'),('谢谢','ms','terima kasih'),
    ('再见','en','goodbye'),('再见','th','ลาก่อน'),('再见','vi','tạm biệt'),('再见','ms','selamat tinggal'),
    ('请问','en','excuse me / may I ask'),('请问','th','ขอโทษนะ (ขอถาม)'),('请问','vi','cho hỏi'),('请问','ms','tumpang tanya'),
    ('对不起','en','sorry'),('对不起','th','ขอโทษ'),('对不起','vi','xin lỗi'),('对不起','ms','maaf'),
    ('一','en','one'),('一','th','หนึ่ง'),('一','vi','một'),('一','ms','satu'),
    ('二','en','two'),('二','th','สอง'),('二','vi','hai'),('二','ms','dua'),
    ('三','en','three'),('三','th','สาม'),('三','vi','ba'),('三','ms','tiga'),
    ('今天','en','today'),('今天','th','วันนี้'),('今天','vi','hôm nay'),('今天','ms','hari ini'),
    ('现在','en','now'),('现在','th','ตอนนี้'),('现在','vi','bây giờ'),('现在','ms','sekarang'),
    ('妈妈','en','mom'),('妈妈','th','แม่'),('妈妈','vi','mẹ'),('妈妈','ms','ibu'),
    ('爸爸','en','dad'),('爸爸','th','พ่อ'),('爸爸','vi','bố'),('爸爸','ms','ayah'),
    ('哥哥','en','older brother'),('哥哥','th','พี่ชาย'),('哥哥','vi','anh trai'),('哥哥','ms','abang'),
    ('妹妹','en','younger sister'),('妹妹','th','น้องสาว'),('妹妹','vi','em gái'),('妹妹','ms','adik perempuan'),
    ('姐姐','en','older sister'),('姐姐','th','พี่สาว'),('姐姐','vi','chị gái'),('姐姐','ms','kakak'),
    ('弟弟','en','younger brother'),('弟弟','th','น้องชาย'),('弟弟','vi','em trai'),('弟弟','ms','adik lelaki'),
    ('米饭','en','(cooked) rice'),('米饭','th','ข้าว'),('米饭','vi','cơm'),('米饭','ms','nasi'),
    ('茶','en','tea'),('茶','th','ชา'),('茶','vi','trà'),('茶','ms','teh'),
    ('水','en','water'),('水','th','น้ำ'),('水','vi','nước'),('水','ms','air'),
    ('苹果','en','apple'),('苹果','th','แอปเปิล'),('苹果','vi','táo'),('苹果','ms','epal'),
    ('出租车','en','taxi'),('出租车','th','แท็กซี่'),('出租车','vi','taxi'),('出租车','ms','teksi'),
    ('飞机','en','airplane'),('飞机','th','เครื่องบิน'),('飞机','vi','máy bay'),('飞机','ms','kapal terbang'),
    ('火车站','en','train station'),('火车站','th','สถานีรถไฟ'),('火车站','vi','ga tàu'),('火车站','ms','stesen kereta api')
  ) AS g(hanzi, lang, gloss) ON g.hanzi = mi.hanzi
  WHERE mi.hsk_level = 1
  ON CONFLICT (item_id, language_code) DO NOTHING;
END $$;
