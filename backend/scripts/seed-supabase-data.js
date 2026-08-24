#!/usr/bin/env node
/**
 * Supabase Data Seed Script
 * =========================
 * Migrates production data from the mock data store into Supabase.
 *
 * The Supabase migration created the schema (tables, RLS, triggers) but
 * never transferred the actual application data. This script completes
 * the migration by inserting activities, attendance, messages, and
 * contributions using the correct Supabase Auth UUIDs.
 *
 * Run:  node backend/scripts/seed-supabase-data.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── ID Mapping: Mock IDs → Supabase Auth UUIDs ─────────────────
// Built from the actual profiles table (verified via direct DB query)

async function buildIdMap() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email');

  if (error) throw new Error('Failed to fetch profiles: ' + error.message);

  const emailToUuid = {};
  profiles.forEach(p => { emailToUuid[p.email] = p.id; });

  // Mock ID → email mapping (from mockData.js)
  const mockIdToEmail = {
    'u-001': 'dhairya@club.edu',
    'u-002': 'rahul@club.edu',
    'u-003': 'ananya@club.edu',
    'u-004': 'drpriya@club.edu',
    'u-005': 'karan@club.edu',
    'u-006': 'priya@club.edu',
    'u-007': 'arjun@club.edu',
    // u-008 through u-014 do not have Supabase auth accounts
  };

  const idMap = {};
  for (const [mockId, email] of Object.entries(mockIdToEmail)) {
    if (emailToUuid[email]) {
      idMap[mockId] = emailToUuid[email];
    }
  }

  console.log(`Mapped ${Object.keys(idMap).length} mock IDs to Supabase UUIDs`);
  return idMap;
}

// ─── Check if data already exists ────────────────────────────────

async function checkExistingData() {
  const tables = ['activities', 'attendance', 'messages', 'contributions'];
  const counts = {};
  for (const table of tables) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    counts[table] = count || 0;
  }
  return counts;
}

// ─── Seed Activities ─────────────────────────────────────────────

async function seedActivities(idMap) {
  const activities = [
    // Upcoming
    {
      title: 'Public Policy Orientation 2026',
      description: 'An introductory session for new members about the fundamentals of public policy analysis. We will cover frameworks for understanding policy problems, stakeholder mapping, and evidence-based approaches. Guest speaker from the Department of Public Administration will share real-world case studies.',
      cover_image: null,
      additional_images: [],
      date: '2026-08-20',
      time: '16:00:00',
      location: 'Seminar Hall B, Main Building',
      status: 'upcoming',
      category: 'Orientation',
      created_by: idMap['u-001'],
    },
    {
      title: 'Inter-College Debate Championship',
      description: 'Annual inter-college debate championship on contemporary socio-political issues. This year\'s topic: "Should AI be regulated by a global governance body?" Teams of two will compete in British Parliamentary format. Prizes for Best Speaker and Best Team.',
      cover_image: null,
      additional_images: [],
      date: '2026-08-28',
      time: '10:00:00',
      location: 'Auditorium, Academic Block',
      status: 'upcoming',
      category: 'Competition',
      created_by: idMap['u-002'],
    },
    {
      title: 'Documentary Screening: The Social Dilemma',
      description: 'Movie night with a purpose! We will screen "The Social Dilemma" followed by a moderated group discussion on digital privacy, algorithmic manipulation, and what policy interventions might look like. Snacks will be provided.',
      cover_image: null,
      additional_images: [],
      date: '2026-09-05',
      time: '18:00:00',
      location: 'Media Room, Library Building',
      status: 'upcoming',
      category: 'Screening',
      created_by: idMap['u-003'],
    },
    // Completed
    {
      title: 'Budget Analysis Workshop',
      description: 'Hands-on workshop where members analyzed the Union Budget 2026-27. Participants learned to read budget documents, identify allocations for social sectors, and critique fiscal policy decisions. An excellent session with active participation from all attendees.',
      cover_image: null,
      additional_images: [],
      date: '2026-07-25',
      time: '15:00:00',
      location: 'Room 204, Social Sciences Block',
      status: 'completed',
      category: 'Workshop',
      created_by: idMap['u-001'],
    },
    {
      title: 'Guest Lecture: Urban Governance',
      description: 'A thought-provoking guest lecture by Prof. Ramesh Iyer on challenges facing urban local bodies in India. Topics covered included municipal finance, smart city initiatives, and citizen participation in urban planning.',
      cover_image: null,
      additional_images: [],
      date: '2026-07-18',
      time: '14:00:00',
      location: 'Lecture Theatre 1',
      status: 'completed',
      category: 'Lecture',
      created_by: idMap['u-004'],
    },
    {
      title: 'Club Meeting — Semester Planning',
      description: 'Monthly club meeting to plan activities for the monsoon semester. All members discussed proposals, voted on event ideas, and assigned responsibilities. Minutes of the meeting have been circulated via email.',
      cover_image: null,
      additional_images: [],
      date: '2026-07-05',
      time: '16:30:00',
      location: 'Conference Room, Admin Block',
      status: 'completed',
      category: 'Meeting',
      created_by: idMap['u-002'],
    },
    {
      title: 'Debate Workshop for Beginners',
      description: 'A foundational workshop on debate techniques, argumentation, and public speaking skills. Members practiced with mock debate rounds and received feedback from senior debaters.',
      cover_image: null,
      additional_images: [],
      date: '2026-06-20',
      time: '15:00:00',
      location: 'Seminar Hall A',
      status: 'completed',
      category: 'Workshop',
      created_by: idMap['u-003'],
    },
    // Cancelled
    {
      title: 'Field Visit: State Legislature',
      description: 'Planned educational visit to the State Legislature to observe proceedings. Unfortunately cancelled due to scheduling conflicts with the legislative session calendar.',
      cover_image: null,
      additional_images: [],
      date: '2026-07-10',
      time: '09:00:00',
      location: 'State Legislature Complex',
      status: 'cancelled',
      category: 'Field Visit',
      created_by: idMap['u-001'],
    },
  ];

  const { data, error } = await supabase
    .from('activities')
    .insert(activities)
    .select();

  if (error) throw new Error('Failed to seed activities: ' + error.message);
  console.log(`✅ Seeded ${data.length} activities`);
  return data;
}

// ─── Seed Attendance ─────────────────────────────────────────────

async function seedAttendance(idMap, activities) {
  // Generate attendance for completed activities only
  const completedActivities = activities.filter(a => a.status === 'completed');
  const memberIds = Object.values(idMap);

  const records = [];
  const adminId = idMap['u-001']; // Dhairya (president) is the attendance recorder

  // Use deterministic attendance based on a simple hash to be consistent
  completedActivities.forEach((activity, actIdx) => {
    memberIds.forEach((memberId, memIdx) => {
      // Leadership + teacher always present, others ~75% based on deterministic pattern
      const isLeadershipOrTeacher =
        memberId === idMap['u-001'] || memberId === idMap['u-002'] ||
        memberId === idMap['u-003'] || memberId === idMap['u-004'];

      const hashVal = (actIdx * 7 + memIdx * 13) % 4; // deterministic
      const isPresent = isLeadershipOrTeacher || hashVal !== 0; // ~75% for normal members

      records.push({
        activity_id: activity.id,
        member_id: memberId,
        status: isPresent ? 'present' : 'absent',
        updated_by: adminId,
      });
    });
  });

  const { data, error } = await supabase
    .from('attendance')
    .insert(records)
    .select();

  if (error) throw new Error('Failed to seed attendance: ' + error.message);
  console.log(`✅ Seeded ${data.length} attendance records`);
  return data;
}

// ─── Seed Messages ───────────────────────────────────────────────

async function seedMessages(idMap) {
  // Only include messages from users that exist in Supabase
  const messages = [
    {
      sender_id: idMap['u-001'],
      message: 'Hey everyone! Welcome to the new semester. Hope you all had a great break! 🎉',
      created_at: '2026-08-01T10:00:00.000Z',
    },
    {
      sender_id: idMap['u-002'],
      message: 'Thanks Dhairya! Excited to get back to our activities. The planning meeting was really productive.',
      created_at: '2026-08-01T10:05:00.000Z',
    },
    {
      sender_id: idMap['u-005'],
      message: 'When is the first event this semester?',
      created_at: '2026-08-01T10:10:00.000Z',
    },
    {
      sender_id: idMap['u-001'],
      message: 'We have the Public Policy Orientation on August 20th. Perfect for new members to get up to speed!',
      created_at: '2026-08-01T10:12:00.000Z',
    },
    {
      sender_id: idMap['u-003'],
      message: 'I\'ve also been working on the inter-college debate championship. It\'s going to be amazing!',
      created_at: '2026-08-01T10:15:00.000Z',
    },
    {
      sender_id: idMap['u-006'],
      message: 'Can we organize a study group for the policy orientation? I want to prepare.',
      created_at: '2026-08-02T11:30:00.000Z',
    },
    {
      sender_id: idMap['u-004'],
      message: 'Great initiative, Priya! I can share some reading materials in advance.',
      created_at: '2026-08-02T11:45:00.000Z',
    },
    {
      sender_id: idMap['u-007'],
      message: 'Has anyone seen the documentary we\'re screening? No spoilers please 😂',
      created_at: '2026-08-03T14:00:00.000Z',
    },
    {
      sender_id: idMap['u-002'],
      message: 'Yes! It\'s open to the entire college. We\'re expecting teams from 5 other colleges too.',
      created_at: '2026-08-05T16:15:00.000Z',
    },
    {
      sender_id: idMap['u-001'],
      message: 'Absolutely! The orientation is specifically designed for new members. No prior knowledge needed.',
      created_at: '2026-08-06T09:35:00.000Z',
    },
    {
      sender_id: idMap['u-003'],
      message: 'That would be fantastic! Let\'s coordinate for proper coverage of the championship.',
      created_at: '2026-08-07T13:10:00.000Z',
    },
    {
      sender_id: idMap['u-004'],
      message: 'Excellent discussion, everyone. Let\'s keep this energy going into the semester!',
      created_at: '2026-08-10T11:20:00.000Z',
    },
    {
      sender_id: idMap['u-001'],
      message: 'Guys, are we meeting tomorrow at 4 PM for the pre-orientation prep?',
      created_at: '2026-08-14T16:32:00.000Z',
    },
    {
      sender_id: idMap['u-002'],
      message: 'Yes, I\'ll be there!',
      created_at: '2026-08-14T16:34:00.000Z',
    },
    {
      sender_id: idMap['u-005'],
      message: 'Count me in. See you all tomorrow.',
      created_at: '2026-08-14T16:40:00.000Z',
    },
  ];

  const { data, error } = await supabase
    .from('messages')
    .insert(messages)
    .select();

  if (error) throw new Error('Failed to seed messages: ' + error.message);
  console.log(`✅ Seeded ${data.length} messages`);
  return data;
}

// ─── Seed Contributions ──────────────────────────────────────────

async function seedContributions(idMap) {
  // Only include contributions where BOTH member_id and recorded_by exist in Supabase
  const contributions = [
    // Dhairya (president) — contributions recorded by Dr. Priya
    {
      member_id: idMap['u-001'],
      category: 'EVENT_ORGANIZED',
      contribution_type: 'LEAD_ORGANIZER',
      title: 'Organized Inter-College Debate Championship',
      description: 'Planned and coordinated the entire debate event — venue booking, team registrations, judging panel, logistics.',
      points: 12,
      date: '2026-08-08',
      recorded_by: idMap['u-004'],
    },
    {
      member_id: idMap['u-001'],
      category: 'TASK',
      contribution_type: 'STANDARD_TASK',
      title: 'Created debate registration form',
      description: 'Built an online Google Form for inter-college debate team signups with automated confirmation.',
      points: 5,
      date: '2026-08-05',
      recorded_by: idMap['u-004'],
      external_link: 'https://forms.google.com/example',
    },
    // Rahul (VP) — contributions
    {
      member_id: idMap['u-002'],
      category: 'TASK',
      contribution_type: 'STANDARD_TASK',
      title: 'Designed event poster for Budget Workshop',
      description: 'Created promotional poster using Canva, distributed on social media channels.',
      points: 5,
      date: '2026-07-20',
      recorded_by: idMap['u-001'],
    },
    {
      member_id: idMap['u-002'],
      category: 'EVENT_SUPPORT',
      contribution_type: 'EVENT_SUPPORT',
      title: 'Managed venue setup for Club Meeting',
      description: 'Coordinated with admin block staff, arranged seating and AV equipment.',
      points: 5,
      date: '2026-07-05',
      recorded_by: idMap['u-004'],
    },
    // Ananya (General Secretary) — contributions
    {
      member_id: idMap['u-003'],
      category: 'TASK',
      contribution_type: 'MAJOR_TASK',
      title: 'Prepared semester activity calendar',
      description: 'Compiled and scheduled all planned activities for monsoon semester, coordinated with faculty advisors.',
      points: 7,
      date: '2026-07-01',
      recorded_by: idMap['u-004'],
    },
    {
      member_id: idMap['u-003'],
      category: 'RESOURCE',
      contribution_type: 'STANDARD_RESOURCE',
      title: 'Meeting minutes template',
      description: 'Created a standardized template for recording club meeting minutes.',
      points: 3,
      date: '2026-07-06',
      recorded_by: idMap['u-001'],
    },
    // Karan (normal member) — contributions
    {
      member_id: idMap['u-005'],
      category: 'RESOURCE',
      contribution_type: 'MAJOR_RESOURCE',
      title: 'Indian Budget 2026-27 Analysis Pack',
      description: 'Compiled a 15-page analysis of key budget allocations for social sectors, used in Budget Analysis Workshop.',
      points: 5,
      date: '2026-07-22',
      recorded_by: idMap['u-001'],
    },
    {
      member_id: idMap['u-005'],
      category: 'TASK',
      contribution_type: 'SMALL_TASK',
      title: 'Collected participant feedback',
      description: 'Distributed and collected feedback forms after the Budget Analysis Workshop.',
      points: 2,
      date: '2026-07-26',
      recorded_by: idMap['u-003'],
    },
  ];

  const { data, error } = await supabase
    .from('contributions')
    .insert(contributions)
    .select();

  if (error) throw new Error('Failed to seed contributions: ' + error.message);
  console.log(`✅ Seeded ${data.length} contributions`);
  return data;
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Supabase Data Seed Script');
  console.log('============================\n');

  // Check for existing data
  const existing = await checkExistingData();
  console.log('Current data counts:', existing);

  if (existing.activities > 0 || existing.messages > 0 || existing.contributions > 0) {
    console.log('\n⚠️  Data already exists. Skipping seed to avoid duplicates.');
    console.log('   To re-seed, manually clear the tables first.');
    return;
  }

  // Build ID map
  const idMap = await buildIdMap();
  if (Object.keys(idMap).length === 0) {
    console.error('❌ No profiles found. Cannot seed data without existing user profiles.');
    process.exit(1);
  }

  console.log('');

  // Seed in order (respecting foreign key constraints)
  const activities = await seedActivities(idMap);
  await seedAttendance(idMap, activities);
  await seedMessages(idMap);
  await seedContributions(idMap);

  console.log('\n✅ Data seeding complete!');

  // Verify
  const counts = await checkExistingData();
  console.log('\nFinal data counts:', counts);
}

main().catch(err => {
  console.error('\n❌ Seed script failed:', err.message);
  process.exit(1);
});
