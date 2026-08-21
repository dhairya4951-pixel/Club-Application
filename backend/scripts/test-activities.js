/**
 * Activities & Attendance — Integration Tests
 * ===========================================
 * Tests the operations and security roles for activities and attendance.
 *
 * Usage:
 *   cd backend
 *   node scripts/test-activities.js
 *
 * Runs in mock mode if Supabase is not configured.
 */

require('dotenv').config();
const activityService = require('../src/services/activityService');
const attendanceService = require('../src/services/attendanceService');

// ─── Helpers ─────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

// ─── Mock Users ──────────────────────────────────────────────

const TEACHER = { id: 'u-004', role: 'teacher_admin', name: 'Dr. Priya' };
const MEMBER  = { id: 'u-005', role: 'member', name: 'Karan Singh' };

// ─── Tests ───────────────────────────────────────────────────

async function runTests() {
  console.log('\n🧪 Activities & Attendance — Test Suite\n');
  
  let createdActivityId = null;

  // ══════════════════════════════════════════════════════════════
  // TEST 1: Create an Activity
  // ══════════════════════════════════════════════════════════════
  section('Test 1 — Create an Activity');
  {
    const result = await activityService.createActivity({
      title: 'Test Activity',
      description: 'Integration test activity',
      date: '2026-10-15',
      time: '14:00',
      location: 'Room 101',
      createdBy: TEACHER.id
    });
    
    assert('Activity created successfully', !result.error, result.error || '');
    assert('Activity has an ID', !!result.data?.id);
    
    if (result.data) {
      createdActivityId = result.data.id;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 2: Admin can update attendance
  // ══════════════════════════════════════════════════════════════
  section('Test 2 — Admin can update attendance');
  {
    if (createdActivityId) {
      // In the API layer, the route checks requireAdmin.
      // Here we just verify the service works.
      const records = [
        { memberId: MEMBER.id, status: 'present' }
      ];
      
      const result = await attendanceService.updateActivityAttendance(
        createdActivityId,
        records,
        TEACHER.id
      );
      
      assert('Attendance updated successfully', !result.error, result.error || '');
      
      const memberRecord = result.data?.records?.find(
        r => r.memberId === MEMBER.id || r.member_id === MEMBER.id
      );
      
      assert(
        'Member status is present',
        memberRecord?.status === 'present',
        `Got: ${memberRecord?.status}`
      );
    } else {
      assert('Skipped due to Test 1 failure', false);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 3: Normal member CANNOT update attendance
  // ══════════════════════════════════════════════════════════════
  section('Test 3 — Normal member CANNOT update attendance');
  {
    // The security guard is implemented at the Express route level via requireAdmin middleware.
    // We will verify the user model properties which the middleware uses.
    const { hasAdminAccess } = require('../src/models/User');
    
    assert(
      'hasAdminAccess() returns false for normal member',
      hasAdminAccess(MEMBER) === false,
      `Got: ${hasAdminAccess(MEMBER)}`
    );
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 4: Delete the Activity (Cleanup)
  // ══════════════════════════════════════════════════════════════
  section('Test 4 — Delete the Activity');
  {
    if (createdActivityId) {
      const result = await activityService.deleteActivity(createdActivityId);
      assert('Activity deleted successfully', !result.error, result.error || '');
    } else {
      assert('Skipped due to Test 1 failure', false);
    }
  }

  // ─── Summary ──────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(60) + '\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('\n💥 Test runner crashed:', err);
  process.exit(1);
});
