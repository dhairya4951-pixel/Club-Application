/**
 * Seed Script — Creates initial user accounts in Supabase Auth
 * =============================================================
 * Run this ONCE after applying the SQL migrations to populate
 * the database with the existing mock user accounts.
 *
 * Usage:
 *   cd backend
 *   node scripts/seed-users.js
 *
 * Prerequisites:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env
 *   - The SQL migrations must have been applied (profiles table must exist)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Seed Data ───────────────────────────────────────────────
// Mirrors the mock data accounts from backend/src/data/mockData.js

const SEED_USERS = [
  {
    email: 'drpriya@club.edu',
    password: 'admin123',
    metadata: {
      name: 'Dr. Priya Sharma',
      role: 'teacher_admin',
      position: 'none',
      course: 'Department of Political Science',
      year: 'Faculty',
      bio: "Faculty advisor and mentor. Guides the club's academic initiatives and ensures alignment with institutional goals.",
    },
  },
  {
    email: 'dhairya@club.edu',
    password: 'member123',
    metadata: {
      name: 'Dhairya Patel',
      role: 'member',
      position: 'president',
      course: 'B.A. Political Science',
      year: '3rd Year',
      bio: 'Passionate about public policy and youth leadership. Founded the club to create a space for meaningful civic discourse.',
    },
  },
  {
    email: 'rahul@club.edu',
    password: 'member123',
    metadata: {
      name: 'Rahul Mehta',
      role: 'member',
      position: 'vice_president',
      course: 'B.Com. Honours',
      year: '3rd Year',
      bio: 'Handling club operations and communications. Believes in organized teamwork and transparent governance.',
    },
  },
  {
    email: 'ananya@club.edu',
    password: 'member123',
    metadata: {
      name: 'Ananya Sharma',
      role: 'member',
      position: 'general_secretary',
      course: 'B.A. Economics',
      year: '2nd Year',
      bio: 'Coordinates events and manages internal communications. Dedicated to making every club activity impactful.',
    },
  },
  {
    email: 'karan@club.edu',
    password: 'member123',
    metadata: {
      name: 'Karan Singh',
      role: 'member',
      position: 'none',
      course: 'B.A. History',
      year: '2nd Year',
      bio: 'History enthusiast with a keen interest in Indian constitutional development.',
    },
  },
  {
    email: 'priya@club.edu',
    password: 'member123',
    metadata: {
      name: 'Priya Nair',
      role: 'member',
      position: 'none',
      course: 'B.A. Sociology',
      year: '1st Year',
      bio: 'Interested in social justice and community development programs.',
    },
  },
  {
    email: 'arjun@club.edu',
    password: 'member123',
    metadata: {
      name: 'Arjun Verma',
      role: 'member',
      position: 'none',
      course: 'B.A. Political Science',
      year: '1st Year',
      bio: 'Keen follower of Indian politics. Interested in electoral analysis and parliamentary debates.',
    },
  },
];

// ─── Seed Runner ─────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Seeding Supabase Auth users...\n');

  for (const u of SEED_USERS) {
    process.stdout.write(`  Creating ${u.email}...`);

    // Create auth user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.metadata,
    });

    if (error) {
      if (error.message?.toLowerCase().includes('already')) {
        console.log(' ⚠️  Already exists (skipped)');
      } else {
        console.log(` ❌ Error: ${error.message}`);
      }
      continue;
    }

    const userId = data.user.id;

    // Update the profile's role — Supabase Auth metadata carries role/position
    // but the trigger uses it to seed the profile. However, we set role directly
    // because teacher_admin is a custom role that needs explicit DB enforcement.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: u.metadata.role, position: u.metadata.position })
      .eq('id', userId);

    if (profileError) {
      console.log(` ⚠️  Profile update warning: ${profileError.message}`);
    } else {
      console.log(' ✅');
    }
  }

  console.log('\n✅ Seed complete.\n');
  console.log('Test credentials:');
  console.log('  Teacher:   drpriya@club.edu / admin123');
  console.log('  President: dhairya@club.edu / member123');
  console.log('  Member:    karan@club.edu   / member123\n');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
