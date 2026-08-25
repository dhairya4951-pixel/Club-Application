-- Migration: Add updated_at column to messages table
-- =================================================
-- Enables tracking when a message has been edited.
-- NULL means the message has never been edited.

ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
