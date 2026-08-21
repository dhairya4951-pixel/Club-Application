-- Migration 005: Enable Supabase Realtime for Messages
-- ================================================================
-- Adds the messages table to the supabase_realtime publication
-- so the frontend can receive live updates.
-- ================================================================

-- This creates the publication if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add the messages table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
