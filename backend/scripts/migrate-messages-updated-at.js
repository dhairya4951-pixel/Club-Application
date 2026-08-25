#!/usr/bin/env node
/**
 * Run Database Migration: Add updated_at to messages
 * ===================================================
 * 
 * Usage:
 *   DATABASE_URL="postgresql://postgres.hnnjfupgzdndejlnzjku:[YOUR_DB_PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" node scripts/migrate-messages-updated-at.js
 *
 * OR: Just paste this SQL in the Supabase Dashboard SQL Editor:
 *   ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NULL;
 *
 * Dashboard URL:
 *   https://supabase.com/dashboard/project/hnnjfupgzdndejlnzjku/sql/new
 */

const { Client } = require('pg');

async function migrate() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.log('');
    console.log('❌ DATABASE_URL not set.');
    console.log('');
    console.log('Option 1: Run this SQL manually in the Supabase Dashboard SQL Editor:');
    console.log('  https://supabase.com/dashboard/project/hnnjfupgzdndejlnzjku/sql/new');
    console.log('');
    console.log('  ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NULL;');
    console.log('');
    console.log('Option 2: Set DATABASE_URL and re-run this script.');
    console.log('  Find the connection string at: Supabase Dashboard → Settings → Database → Connection string');
    console.log('');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    await client.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NULL;');
    console.log('✅ Migration applied: messages.updated_at column added');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
