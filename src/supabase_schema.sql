-- ─── Run this in your Supabase SQL editor ────────────────────────────────────

-- Rooms table
CREATE TABLE rooms (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL DEFAULT 'Untitled Room',
  background  TEXT,
  items       JSONB DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX rooms_user_id_idx ON rooms(user_id);

-- Row Level Security — users can only access their own rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rooms"
  ON rooms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rooms"
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rooms"
  ON rooms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rooms"
  ON rooms FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Storage bucket ───────────────────────────────────────────────────────────
-- Run this in Supabase Dashboard → Storage → New Bucket
-- OR run this SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true);

-- Storage RLS policies
CREATE POLICY "Users can upload their own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'room-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view room images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'room-images');

CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'room-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
