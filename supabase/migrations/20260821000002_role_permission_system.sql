-- Migration 003: Role & Permission System — DB-Level Enforcement
-- ================================================================
-- This migration adds:
--   1. An atomic position-swap stored procedure (prevents race conditions)
--   2. A DB-level guard preventing role/position escalation through direct SQL
--   3. Row Level Security (RLS) policies on the profiles table
--   4. An audit log trigger for all position/role changes
-- ================================================================


-- ==============================================================================
-- 1. ATOMIC POSITION ASSIGNMENT FUNCTION
-- ==============================================================================
-- This function replaces the two-step Node.js sequence that was NOT atomic.
-- It executes inside a single DB transaction, so:
--   - If setting the new holder fails, the old holder keeps their position.
--   - The unique partial index is NEVER violated mid-transaction.
--
-- Parameters:
--   p_member_id    UUID  — the member to receive the position
--   p_position     TEXT  — 'president' | 'vice_president' | 'general_secretary' | 'none'
--   p_requester_id UUID  — the teacher performing the action (for audit log)
--
-- Returns JSONB: { "new_holder": {...}, "previous_holder": {...} | null }
-- Raises EXCEPTION on any violation (caught by Node.js as a Supabase error).

CREATE OR REPLACE FUNCTION assign_leadership_position(
  p_member_id    UUID,
  p_position     app_position,
  p_requester_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with the privileges of the function owner (postgres)
AS $$
DECLARE
  v_requester    RECORD;
  v_target       RECORD;
  v_prev_holder  RECORD;
  v_result       JSONB;
BEGIN
  -- ── Guard 1: Requester must be teacher_admin ──────────────────────────────
  SELECT role INTO v_requester FROM profiles WHERE id = p_requester_id;

  IF NOT FOUND OR v_requester.role != 'teacher_admin' THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Only the Teacher/Super Admin can assign positions'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- ── Guard 2: Target member must exist and not be teacher_admin ───────────
  SELECT id, name, role, position INTO v_target FROM profiles WHERE id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Member not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_target.role = 'teacher_admin' THEN
    RAISE EXCEPTION 'INVALID_OPERATION: Cannot assign student positions to the Teacher/Super Admin account'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- ── Handle 'none' — strip position ────────────────────────────────────────
  IF p_position = 'none' THEN
    UPDATE profiles SET position = 'none' WHERE id = p_member_id;

    -- Audit log
    INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, details)
    VALUES (
      'POSITION_REMOVED',
      'profile',
      p_member_id,
      p_requester_id,
      jsonb_build_object(
        'member_name', v_target.name,
        'previous_position', v_target.position
      )
    );

    SELECT row_to_json(p)::JSONB INTO v_result FROM profiles p WHERE id = p_member_id;
    RETURN jsonb_build_object('new_holder', v_result, 'previous_holder', NULL);
  END IF;

  -- ── Find and strip the current holder (if any) ────────────────────────────
  SELECT id, name, position INTO v_prev_holder
  FROM profiles
  WHERE position = p_position AND id != p_member_id;

  IF FOUND THEN
    -- Strip the current holder's position FIRST (within same transaction)
    UPDATE profiles SET position = 'none' WHERE id = v_prev_holder.id;
  END IF;

  -- ── Assign the new position ───────────────────────────────────────────────
  -- The unique partial index will enforce that no two rows can have the same
  -- leadership position. Since we stripped the previous holder above in this
  -- same transaction, the constraint will not be violated.
  UPDATE profiles SET position = p_position WHERE id = p_member_id;

  -- ── Audit log ─────────────────────────────────────────────────────────────
  INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, details)
  VALUES (
    'POSITION_ASSIGNED',
    'profile',
    p_member_id,
    p_requester_id,
    jsonb_build_object(
      'member_name', v_target.name,
      'position_assigned', p_position,
      'previous_holder_id', CASE WHEN v_prev_holder.id IS NOT NULL THEN v_prev_holder.id ELSE NULL END,
      'previous_holder_name', CASE WHEN v_prev_holder.name IS NOT NULL THEN v_prev_holder.name ELSE NULL END
    )
  );

  -- ── Build and return result ───────────────────────────────────────────────
  SELECT row_to_json(p)::JSONB INTO v_result FROM profiles p WHERE id = p_member_id;

  RETURN jsonb_build_object(
    'new_holder',
    v_result,
    'previous_holder',
    CASE
      WHEN v_prev_holder.id IS NOT NULL
      THEN jsonb_build_object('id', v_prev_holder.id, 'name', v_prev_holder.name, 'position', v_prev_holder.position)
      ELSE NULL
    END
  );
END;
$$;


-- ==============================================================================
-- 2. DB-LEVEL GUARD: PREVENT ROLE/POSITION ESCALATION VIA DIRECT SQL
-- ==============================================================================
-- This trigger prevents ANY direct UPDATE of the `role` or `position` columns
-- through the standard UPDATE path (e.g., from the anon client or any rogue query).
-- The only allowed path is through the assign_leadership_position() function above,
-- which runs as SECURITY DEFINER (postgres-level privileges).
--
-- Exception: The service role bypass (used by the backend) is handled at the
-- application middleware level. At the DB level this is enforced by ensuring
-- normal users (anon/authenticated JWT) cannot escalate.

CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Block attempts to change role via normal UPDATE
  IF NEW.role != OLD.role THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Role changes are not permitted through direct updates. Use the admin API.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Block attempts to change position via normal UPDATE (must use assign_leadership_position())
  -- NOTE: This trigger is attached to the profiles table for the 'authenticated' role.
  -- The backend uses the service role which is exempt from RLS.
  -- This guard exists as an extra layer for any direct authenticated-user updates.
  IF NEW.position != OLD.position THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Position changes are not permitted through direct updates. Use the position management API.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This trigger fires ONLY for connections using the 'authenticated' JWT role
-- (i.e., logged-in frontend users who bypassed the Express backend).
-- The backend's service role is not affected.
CREATE OR REPLACE TRIGGER enforce_no_self_promotion
  BEFORE UPDATE OF role, position ON profiles
  FOR EACH ROW
  WHEN (current_setting('role', true) = 'authenticated')
  EXECUTE FUNCTION prevent_role_escalation();


-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES ON PROFILES
-- ==============================================================================
-- RLS protects the profiles table from direct Supabase client access (anon key).
-- Our Express backend uses the service role key which bypasses RLS entirely.
-- These policies apply only when someone connects via the anon/authenticated JWT.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Any authenticated user can read all profiles (needed for members page, etc.)
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: A user can update their OWN profile (for name, bio, course, year, profile_image only)
-- The role/position update guard trigger above prevents escalation even on self-updates.
CREATE POLICY "Users can update their own profile fields"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: No direct INSERT from authenticated users — profiles are created only via
-- the handle_new_user() trigger (SECURITY DEFINER) when the admin creates an auth user.
CREATE POLICY "No direct profile inserts from clients"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Policy: No direct DELETE from authenticated users — deletion goes through the
-- backend's admin.deleteUser() call which cascades via the FK.
CREATE POLICY "No direct profile deletes from clients"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (false);

-- Policy: anon (unauthenticated) users cannot access profiles at all
CREATE POLICY "Anon users cannot access profiles"
  ON profiles
  FOR ALL
  TO anon
  USING (false);


-- ==============================================================================
-- 4. RLS ON OTHER TABLES (protect against direct client access)
-- ==============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read audit logs (admin pages)
CREATE POLICY "Authenticated users can read audit logs"
  ON audit_logs FOR SELECT TO authenticated USING (true);

-- No direct writes to audit logs from clients — only the backend and DB functions write here
CREATE POLICY "No direct audit log writes from clients"
  ON audit_logs FOR INSERT TO authenticated WITH CHECK (false);
