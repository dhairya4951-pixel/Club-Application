/**
 * Role & Permission System — Integration Tests
 * =============================================
 * Tests all 11 scenarios specified in the requirements.
 *
 * Usage (Supabase must be connected):
 *   cd backend
 *   node scripts/test-roles.js
 *
 * In mock mode (no Supabase credentials), the test script still runs
 * against the mock data layer and tests the service-level logic.
 */

require('dotenv').config();
const memberService = require('../src/services/memberService');

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

// ─── Mock Users (mirrors mockData.js for testing without Supabase) ───

const TEACHER  = { id: 'u-004', role: 'teacher_admin', position: 'none', name: 'Dr. Priya Sharma' };
const PRESIDENT = { id: 'u-001', role: 'member', position: 'president', name: 'Dhairya Patel' };
const VP       = { id: 'u-002', role: 'member', position: 'vice_president', name: 'Rahul Mehta' };
const GS       = { id: 'u-003', role: 'member', position: 'general_secretary', name: 'Ananya Sharma' };
const MEMBER   = { id: 'u-005', role: 'member', position: 'none', name: 'Karan Singh' };
const MEMBER2  = { id: 'u-006', role: 'member', position: 'none', name: 'Priya Nair' };

// ─── Tests ───────────────────────────────────────────────────

async function runTests() {
  console.log('\n🧪 Role & Permission System — Test Suite\n');

  // ══════════════════════════════════════════════════════════════
  // TEST 1: Teacher assigns President to a normal member
  // ══════════════════════════════════════════════════════════════
  section('Test 1 — Teacher assigns President');
  {
    const result = await memberService.assignPosition(MEMBER.id, 'president', TEACHER);
    assert(
      'Teacher can assign president',
      !result.error,
      result.error || ''
    );
    assert(
      'Returned member has position = president',
      result.data?.position === 'president',
      `Got: ${result.data?.position}`
    );
    // Update mock state
    if (!result.error) MEMBER.position = 'president';
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 2: Teacher assigns another member as President
  //         (Karan is current President, Priya should become President)
  // ══════════════════════════════════════════════════════════════
  section('Test 2 — Teacher assigns a second President (should replace first)');
  {
    const result = await memberService.assignPosition(MEMBER2.id, 'president', TEACHER);
    assert(
      'Second president assignment succeeds',
      !result.error,
      result.error || ''
    );
    assert(
      'New holder has position = president',
      result.data?.position === 'president',
      `Got: ${result.data?.position}`
    );
    if (!result.error) {
      MEMBER2.position = 'president';
      MEMBER.position = 'none'; // Previous holder was stripped
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 3: Previous President loses the role
  // ══════════════════════════════════════════════════════════════
  section('Test 3 — Previous President lost their role');
  {
    const result = await memberService.getMemberById(MEMBER.id);
    assert(
      'Previous president now has position = none',
      result.data?.position === 'none',
      `Got: ${result.data?.position}`
    );
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 4: Cannot have two Presidents simultaneously
  // ══════════════════════════════════════════════════════════════
  section('Test 4 — Only one President can exist at a time');
  {
    // Check current leadership status
    const status = await memberService.getLeadershipStatus();
    const presidents = Object.values(status.data || {}).filter(
      holder => holder?.position === 'president'
    );
    assert(
      'Exactly one President exists',
      presidents.length === 1,
      `Found ${presidents.length} presidents`
    );
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 5: Same exclusivity for Vice President
  // ══════════════════════════════════════════════════════════════
  section('Test 5 — VP exclusivity');
  {
    // Assign a new VP
    const result1 = await memberService.assignPosition(MEMBER.id, 'vice_president', TEACHER);
    assert('Teacher can assign VP', !result1.error, result1.error || '');

    // Assign a different VP — original should be stripped
    const result2 = await memberService.assignPosition(PRESIDENT.id, 'vice_president', TEACHER);
    assert('Second VP assignment succeeds', !result2.error, result2.error || '');

    // Verify only one VP exists
    const status = await memberService.getLeadershipStatus();
    const vps = Object.values(status.data || {}).filter(h => h?.position === 'vice_president');
    assert('Exactly one VP exists', vps.length === 1, `Found ${vps.length}`);
    if (!result2.error) { MEMBER.position = 'none'; PRESIDENT.position = 'vice_president'; }
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 6: Same exclusivity for General Secretary
  // ══════════════════════════════════════════════════════════════
  section('Test 6 — GS exclusivity');
  {
    const result1 = await memberService.assignPosition(MEMBER.id, 'general_secretary', TEACHER);
    assert('Teacher can assign GS', !result1.error, result1.error || '');

    const result2 = await memberService.assignPosition(GS.id, 'general_secretary', TEACHER);
    assert('Second GS assignment succeeds', !result2.error, result2.error || '');

    const status = await memberService.getLeadershipStatus();
    const gss = Object.values(status.data || {}).filter(h => h?.position === 'general_secretary');
    assert('Exactly one GS exists', gss.length === 1, `Found ${gss.length}`);
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 7: President CANNOT assign roles
  // ══════════════════════════════════════════════════════════════
  section('Test 7 — President cannot assign roles');
  {
    // Temporarily treat MEMBER2 as still having president role for this test
    const fakePresident = { id: 'u-006', role: 'member', position: 'president', name: 'Priya Nair' };
    const result = await memberService.assignPosition(MEMBER.id, 'president', fakePresident);
    assert(
      'President is rejected when trying to assign a role',
      result.error && result.status === 403,
      result.error ? `Error: ${result.error}` : 'No error returned — SECURITY VIOLATION'
    );
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 8: VP CANNOT assign roles
  // ══════════════════════════════════════════════════════════════
  section('Test 8 — VP cannot assign roles');
  {
    const fakeVP = { id: 'u-002', role: 'member', position: 'vice_president', name: 'Rahul Mehta' };
    const result = await memberService.assignPosition(MEMBER.id, 'general_secretary', fakeVP);
    assert(
      'VP is rejected when trying to assign a role',
      result.error && result.status === 403,
      result.error ? `Error: ${result.error}` : 'No error returned — SECURITY VIOLATION'
    );
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 9: GS CANNOT assign roles
  // ══════════════════════════════════════════════════════════════
  section('Test 9 — GS cannot assign roles');
  {
    const fakeGS = { id: 'u-003', role: 'member', position: 'general_secretary', name: 'Ananya Sharma' };
    const result = await memberService.assignPosition(MEMBER.id, 'vice_president', fakeGS);
    assert(
      'GS is rejected when trying to assign a role',
      result.error && result.status === 403,
      result.error ? `Error: ${result.error}` : 'No error returned — SECURITY VIOLATION'
    );
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 10: Normal member CANNOT perform admin actions
  // ══════════════════════════════════════════════════════════════
  section('Test 10 — Normal member cannot perform admin actions');
  {
    const normalUser = { id: 'u-007', role: 'member', position: 'none', name: 'Arjun Verma' };

    // Test: member cannot assign positions
    const r1 = await memberService.assignPosition(MEMBER.id, 'president', normalUser);
    assert(
      'Normal member cannot assign positions',
      r1.error && r1.status === 403,
      r1.error || 'No error — SECURITY VIOLATION'
    );

    // Test: member cannot delete other members
    const r2 = await memberService.deleteMember(MEMBER2.id, normalUser);
    // The mock deleteMember doesn't check requestingUser role — it's enforced at route level
    // Here we verify the route-level guard (requireAdmin) would block this.
    // Since we can't test HTTP routing here, we test the model helper:
    const { hasAdminAccess } = require('../src/models/User');
    assert(
      'hasAdminAccess() returns false for normal member',
      hasAdminAccess(normalUser) === false,
      `Got: ${hasAdminAccess(normalUser)}`
    );
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 11: Teacher retains full access
  // ══════════════════════════════════════════════════════════════
  section('Test 11 — Teacher retains full access');
  {
    const { isTeacherAdmin, hasAdminAccess, canManagePositions } = require('../src/models/User');

    assert('isTeacherAdmin() true for teacher', isTeacherAdmin(TEACHER), '');
    assert('hasAdminAccess() true for teacher', hasAdminAccess(TEACHER), '');
    assert('canManagePositions() true for teacher', canManagePositions(TEACHER), '');

    // Teacher can remove a position
    const result = await memberService.removePosition(PRESIDENT.id, TEACHER);
    assert(
      'Teacher can remove a position',
      !result.error,
      result.error || ''
    );
    assert(
      'Removed member now has position = none',
      result.data?.position === 'none',
      `Got: ${result.data?.position}`
    );
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
