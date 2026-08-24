-- Migration 006: Enable RLS on All Remaining Tables + Contributions Bucket
-- ================================================================
-- Closes the security gap by enabling Row Level Security on:
--   activities, attendance, messages, contributions
-- Also creates the contributions storage bucket for attachment uploads.
-- ================================================================


-- ==============================================================================
-- 1. ACTIVITIES — RLS
-- ==============================================================================
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view activities (needed for Home, Activities page)
CREATE POLICY "Authenticated users can view all activities"
  ON activities FOR SELECT TO authenticated USING (true);

-- No direct INSERT/UPDATE/DELETE from browser clients.
-- All mutations go through the Express backend (service role bypasses RLS).
CREATE POLICY "No direct activity writes from clients"
  ON activities FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "No direct activity updates from clients"
  ON activities FOR UPDATE TO authenticated USING (false);

CREATE POLICY "No direct activity deletes from clients"
  ON activities FOR DELETE TO authenticated USING (false);

-- Anon users cannot access activities
CREATE POLICY "Anon users cannot access activities"
  ON activities FOR ALL TO anon USING (false);


-- ==============================================================================
-- 2. ATTENDANCE — RLS
-- ==============================================================================
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own attendance records
CREATE POLICY "Users can view their own attendance"
  ON attendance FOR SELECT TO authenticated
  USING (member_id = auth.uid());

-- Admins (via service role) handle all attendance writes.
-- No direct writes from browser clients.
CREATE POLICY "No direct attendance writes from clients"
  ON attendance FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "No direct attendance updates from clients"
  ON attendance FOR UPDATE TO authenticated USING (false);

CREATE POLICY "No direct attendance deletes from clients"
  ON attendance FOR DELETE TO authenticated USING (false);

-- Anon users cannot access attendance
CREATE POLICY "Anon users cannot access attendance"
  ON attendance FOR ALL TO anon USING (false);


-- ==============================================================================
-- 3. MESSAGES — RLS
-- ==============================================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read all messages (club-wide discussion)
CREATE POLICY "Authenticated users can view all messages"
  ON messages FOR SELECT TO authenticated USING (true);

-- Authenticated users can send messages (sender_id must match their auth.uid)
CREATE POLICY "Users can send their own messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- No direct UPDATE from clients (messages are immutable once sent)
CREATE POLICY "No direct message updates from clients"
  ON messages FOR UPDATE TO authenticated USING (false);

-- No direct DELETE from clients (moderation is admin-only via service role)
CREATE POLICY "No direct message deletes from clients"
  ON messages FOR DELETE TO authenticated USING (false);

-- Anon users cannot access messages
CREATE POLICY "Anon users cannot access messages"
  ON messages FOR ALL TO anon USING (false);


-- ==============================================================================
-- 4. CONTRIBUTIONS — RLS
-- ==============================================================================
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view their own contributions
CREATE POLICY "Users can view their own contributions"
  ON contributions FOR SELECT TO authenticated
  USING (member_id = auth.uid());

-- No direct INSERT/UPDATE/DELETE from clients.
-- Only admins (via service role) can create, edit, or delete contributions.
CREATE POLICY "No direct contribution writes from clients"
  ON contributions FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "No direct contribution updates from clients"
  ON contributions FOR UPDATE TO authenticated USING (false);

CREATE POLICY "No direct contribution deletes from clients"
  ON contributions FOR DELETE TO authenticated USING (false);

-- Anon users cannot access contributions
CREATE POLICY "Anon users cannot access contributions"
  ON contributions FOR ALL TO anon USING (false);


-- ==============================================================================
-- 5. CONTRIBUTIONS STORAGE BUCKET
-- ==============================================================================

-- Create the contributions bucket (non-public — attachments are accessed via signed URLs or backend proxy)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contributions', 'contributions', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can read contribution attachments
CREATE POLICY "Authenticated users can view contribution attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contributions');

-- No direct uploads from browser clients — only the backend (service role) handles uploads
-- after verifying the user has admin permissions.
