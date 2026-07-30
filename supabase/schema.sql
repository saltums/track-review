-- =============================================
-- Track Review App - Supabase Schema
-- =============================================

-- UUIDã®æå¹å
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ãã©ãã¯
CREATE TABLE tracks (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ãã¼ã¸ã§ã³
CREATE TABLE versions (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  track_id      UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  version_label TEXT NOT NULL,          -- "Ver.1", "Ver.1.1" ãªã©
  file_url      TEXT NOT NULL,          -- Storageå¬éURL
  storage_path  TEXT NOT NULL,          -- Storageãã¹
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ã¡ã³ãã¼
CREATE TABLE members (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ã³ã¡ã³ã
CREATE TABLE comments (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  version_id      UUID REFERENCES versions(id) ON DELETE CASCADE NOT NULL,
  member_name     TEXT NOT NULL,
  content         TEXT NOT NULL,
  timestamp_start INTEGER,   -- ç§æ°ï¼NULL = ã¿ã¤ã ã¹ã¿ã³ããªãï¼
  timestamp_end   INTEGER,   -- ç§æ°ï¼NULL = åä¸ç¹æå®ï¼
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE tracks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- å¿åã¦ã¼ã¶ã¼ã«å¨æä½ãè¨±å¯ï¼ãã¼ã åãã¼ã«ã®ãããããªãã¯ããªã·ã¼ï¼
CREATE POLICY "public_all" ON tracks   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON members  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON comments FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- ããã©ã«ãã¡ã³ãã¼ï¼å¿è¦ã«å¿ãã¦å¤æ´ï¼
-- =============================================
INSERT INTO members (name) VALUES
  ('ä¸ä¹'),
  ('ç§å¹³'),
  ('ããã'),
  ('ãã®'),
  ('ãªãããããã'),
  ('ããã'),
  ('ããããª'),
  ('ãã·ãª'),
  ('å°å¯º');

-- =============================================
-- Storage: Supabaseããã·ã¥ãã¼ãã§å®æ½
-- =============================================
-- 1. Storage > New bucket ã§ "audio-files" ãä½æ
-- 2. Public bucket ã«ãã§ãã¯ãå¥ãã
-- 3. Policies ã§ anon ã« SELECT / INSERT ãè¨±å¯:
--
-- CREATE POLICY "public read"   ON storage.objects FOR SELECT USING (bucket_id = 'audio-files');
-- CREATE POLICY "public upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio-files');
