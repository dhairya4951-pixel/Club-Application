-- Migration 002: Profile Auto-Sync Trigger
-- ==========================================
-- When a new user signs up via Supabase Auth, automatically create a
-- corresponding profiles row. This prevents orphaned auth accounts
-- with no profile data.
--
-- This trigger fires on INSERT into auth.users, which Supabase manages
-- internally. It extracts metadata supplied at sign-up time (name, role, etc.)
-- and inserts a matching profiles row.
--
-- IMPORTANT: For admin-created users the backend sets the metadata
-- at creation time. For standard user signups (future), it will also fire.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    position,
    profile_image,
    course,
    year,
    bio,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New Member'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')::app_role,
    COALESCE(NEW.raw_user_meta_data->>'position', 'none')::app_position,
    NEW.raw_user_meta_data->>'profile_image',
    NEW.raw_user_meta_data->>'course',
    NEW.raw_user_meta_data->>'year',
    NEW.raw_user_meta_data->>'bio',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Idempotent: safe to re-run if profile already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
