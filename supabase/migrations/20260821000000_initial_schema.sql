-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ENUMS
-- ==============================================================================
CREATE TYPE app_role AS ENUM ('teacher_admin', 'member');
CREATE TYPE app_position AS ENUM ('president', 'vice_president', 'general_secretary', 'none');
CREATE TYPE activity_status AS ENUM ('upcoming', 'completed', 'cancelled');
CREATE TYPE attendance_status AS ENUM ('present', 'absent');

-- ==============================================================================
-- 2. AUTOMATED TIMESTAMP TRIGGER
-- ==============================================================================
-- Creates a reusable function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 3. TABLES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
    email TEXT UNIQUE NOT NULL,
    role app_role NOT NULL DEFAULT 'member',
    position app_position NOT NULL DEFAULT 'none',
    profile_image TEXT,
    course TEXT,
    year TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Apply timestamp trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enforce Leadership Exclusivity: Max ONE of each leadership position
CREATE UNIQUE INDEX unique_president ON profiles (position) WHERE position = 'president';
CREATE UNIQUE INDEX unique_vice_president ON profiles (position) WHERE position = 'vice_president';
CREATE UNIQUE INDEX unique_general_secretary ON profiles (position) WHERE position = 'general_secretary';


-- ------------------------------------------------------------------------------
-- ACTIVITIES
-- ------------------------------------------------------------------------------
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image TEXT,
    additional_images TEXT[] DEFAULT '{}',
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT NOT NULL,
    status activity_status NOT NULL DEFAULT 'upcoming',
    category TEXT NOT NULL DEFAULT 'Other',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Apply timestamp trigger
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ------------------------------------------------------------------------------
-- ATTENDANCE
-- ------------------------------------------------------------------------------
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status attendance_status NOT NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Prevent duplicate attendance records for the same member + activity
    CONSTRAINT unique_member_activity_attendance UNIQUE (activity_id, member_id)
);

-- Apply timestamp trigger
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ------------------------------------------------------------------------------
-- MESSAGES (DISCUSSION)
-- ------------------------------------------------------------------------------
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (char_length(trim(message)) > 0 AND char_length(message) <= 2000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add index on created_at for fast chronologic sorting of chats
CREATE INDEX idx_messages_created_at ON messages(created_at);


-- ------------------------------------------------------------------------------
-- CONTRIBUTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    contribution_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    points INTEGER NOT NULL CHECK (points >= 0),
    date DATE NOT NULL,
    recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    attachment_url TEXT,
    external_link TEXT
);

-- Add indexes for common queries
CREATE INDEX idx_contributions_member_id ON contributions(member_id);
CREATE INDEX idx_contributions_date ON contributions(date DESC);

-- Apply timestamp trigger
CREATE TRIGGER update_contributions_updated_at
    BEFORE UPDATE ON contributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ------------------------------------------------------------------------------
-- AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    details JSONB
);

-- Add indexes for fast log querying
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at DESC);
