-- Mock-exam templates. Idempotent (no-op if any exist).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM mock_exams) THEN RETURN; END IF;
  INSERT INTO mock_exams (hsk_level, title_key, duration_minutes, structure, is_published) VALUES
    (1, 'HSK 1 mock · full format', 32, '{"sections":[{"name":"Listening","count":5},{"name":"Reading","count":5}]}', true),
    (1, 'HSK 1 · Listening only',    15, '{"sections":[{"name":"Listening","count":6}]}', true),
    (2, 'HSK 2 mock · full format', 42, '{"sections":[{"name":"Listening","count":6},{"name":"Reading","count":6}]}', true),
    (3, 'HSK 3 mock · full format', 85, '{"sections":[{"name":"Listening","count":6},{"name":"Reading","count":6}]}', true),
    (4, 'HSK 4 mock · full format', 105, '{"sections":[{"name":"Listening","count":8},{"name":"Reading","count":8}]}', true);
END $$;
