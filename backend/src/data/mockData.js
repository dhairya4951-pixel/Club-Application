/**
 * Mock Data Store
 * ===============
 * All mock data is isolated here. When Supabase is connected,
 * only the service layer files need to change — they will query
 * Supabase instead of importing from this file.
 *
 * Role hierarchy:
 *   teacher_admin — Dr. Priya Sharma (full access + position management)
 *   member + leadership position — Admin-level CRUD, no position management
 *   member + position:none — Normal member
 *
 * Passwords are bcrypt-hashed. The plain-text equivalents for testing:
 *   - Teacher account: "admin123"
 *   - All student accounts: "member123"
 */

const bcrypt = require('bcryptjs');

// Pre-hashed passwords (bcrypt, 10 rounds)
const TEACHER_HASH = bcrypt.hashSync('admin123', 10);
const STUDENT_HASH = bcrypt.hashSync('member123', 10);

// ─── Users ───────────────────────────────────────────────

const users = [
  // Teacher / Super Admin (the only one)
  {
    id: 'u-004',
    name: 'Dr. Priya Sharma',
    email: 'drpriya@club.edu',
    passwordHash: TEACHER_HASH,
    role: 'teacher_admin',
    position: 'none',
    profileImage: null,
    course: 'Department of Political Science',
    year: 'Faculty',
    bio: 'Faculty advisor and mentor. Guides the club\'s academic initiatives and ensures alignment with institutional goals.',
    createdAt: '2025-06-01T10:00:00.000Z',
    updatedAt: '2025-06-01T10:00:00.000Z',
  },

  // Student Leadership — these students hold exclusive positions
  {
    id: 'u-001',
    name: 'Dhairya Patel',
    email: 'dhairya@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'president',
    profileImage: null,
    course: 'B.A. Political Science',
    year: '3rd Year',
    bio: 'Passionate about public policy and youth leadership. Founded the club to create a space for meaningful civic discourse.',
    createdAt: '2025-06-01T10:00:00.000Z',
    updatedAt: '2025-06-01T10:00:00.000Z',
  },
  {
    id: 'u-002',
    name: 'Rahul Mehta',
    email: 'rahul@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'vice_president',
    profileImage: null,
    course: 'B.Com. Honours',
    year: '3rd Year',
    bio: 'Handling club operations and communications. Believes in organized teamwork and transparent governance.',
    createdAt: '2025-06-01T10:00:00.000Z',
    updatedAt: '2025-06-01T10:00:00.000Z',
  },
  {
    id: 'u-003',
    name: 'Ananya Sharma',
    email: 'ananya@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'general_secretary',
    profileImage: null,
    course: 'B.A. Economics',
    year: '2nd Year',
    bio: 'Coordinates events and manages internal communications. Dedicated to making every club activity impactful.',
    createdAt: '2025-06-15T10:00:00.000Z',
    updatedAt: '2025-06-15T10:00:00.000Z',
  },

  // Normal Members
  {
    id: 'u-005',
    name: 'Karan Singh',
    email: 'karan@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'none',
    profileImage: null,
    course: 'B.A. History',
    year: '2nd Year',
    bio: 'History enthusiast with a keen interest in Indian constitutional development.',
    createdAt: '2025-07-01T10:00:00.000Z',
    updatedAt: '2025-07-01T10:00:00.000Z',
  },
  {
    id: 'u-006',
    name: 'Priya Nair',
    email: 'priya@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'none',
    profileImage: null,
    course: 'B.A. Sociology',
    year: '1st Year',
    bio: 'Interested in social justice and community development programs.',
    createdAt: '2025-07-05T10:00:00.000Z',
    updatedAt: '2025-07-05T10:00:00.000Z',
  },
  {
    id: 'u-007',
    name: 'Arjun Verma',
    email: 'arjun@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'none',
    profileImage: null,
    course: 'B.Sc. Mathematics',
    year: '3rd Year',
    bio: 'Enjoys analytical thinking and data-driven approaches to policy analysis.',
    createdAt: '2025-07-10T10:00:00.000Z',
    updatedAt: '2025-07-10T10:00:00.000Z',
  },
  {
    id: 'u-008',
    name: 'Sneha Gupta',
    email: 'sneha@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'none',
    profileImage: null,
    course: 'B.A. English Literature',
    year: '2nd Year',
    bio: 'Loves debating and public speaking. Active participant in MUN conferences.',
    createdAt: '2025-07-12T10:00:00.000Z',
    updatedAt: '2025-07-12T10:00:00.000Z',
  },
  {
    id: 'u-009',
    name: 'Vikram Desai',
    email: 'vikram@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'none',
    profileImage: null,
    course: 'B.Com.',
    year: '1st Year',
    bio: 'New to the club but eager to learn about governance and civic participation.',
    createdAt: '2025-08-01T10:00:00.000Z',
    updatedAt: '2025-08-01T10:00:00.000Z',
  },
  {
    id: 'u-010',
    name: 'Meera Joshi',
    email: 'meera@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'none',
    profileImage: null,
    course: 'B.A. Psychology',
    year: '3rd Year',
    bio: 'Interested in behavioral economics and its applications in public policy.',
    createdAt: '2025-08-05T10:00:00.000Z',
    updatedAt: '2025-08-05T10:00:00.000Z',
  },
  {
    id: 'u-011',
    name: 'Rohan Kapoor',
    email: 'rohan@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'none',
    profileImage: null,
    course: 'B.A. Political Science',
    year: '1st Year',
    bio: 'Aspiring civil servant. Passionate about grassroots governance.',
    createdAt: '2025-08-10T10:00:00.000Z',
    updatedAt: '2025-08-10T10:00:00.000Z',
  },
  {
    id: 'u-012',
    name: 'Ishita Reddy',
    email: 'ishita@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'none',
    profileImage: null,
    course: 'B.A. Journalism',
    year: '2nd Year',
    bio: 'Aspiring journalist covering governance and policy beats.',
    createdAt: '2025-08-12T10:00:00.000Z',
    updatedAt: '2025-08-12T10:00:00.000Z',
  },
  {
    id: 'u-013',
    name: 'Aditya Tiwari',
    email: 'aditya@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'none',
    profileImage: null,
    course: 'B.Sc. Computer Science',
    year: '2nd Year',
    bio: 'Interested in technology policy and digital governance.',
    createdAt: '2025-08-15T10:00:00.000Z',
    updatedAt: '2025-08-15T10:00:00.000Z',
  },
  {
    id: 'u-014',
    name: 'Nisha Patel',
    email: 'nisha@club.edu',
    passwordHash: STUDENT_HASH,
    role: 'member',
    position: 'none',
    profileImage: null,
    course: 'B.A. Philosophy',
    year: '3rd Year',
    bio: 'Thinks deeply about ethics in governance and the philosophy of law.',
    createdAt: '2025-08-20T10:00:00.000Z',
    updatedAt: '2025-08-20T10:00:00.000Z',
  },
];

// ─── Activities ──────────────────────────────────────────

const activities = [
  // Upcoming
  {
    id: 'a-001',
    title: 'Public Policy Orientation 2026',
    description: 'An introductory session for new members about the fundamentals of public policy analysis. We will cover frameworks for understanding policy problems, stakeholder mapping, and evidence-based approaches. Guest speaker from the Department of Public Administration will share real-world case studies.',
    coverImage: '/images/activities/policy-orientation.jpg',
    additionalImages: [],
    date: '2026-08-20',
    time: '4:00 PM',
    location: 'Seminar Hall B, Main Building',
    status: 'upcoming',
    category: 'Orientation',
    createdBy: 'u-001',
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'a-002',
    title: 'Inter-College Debate Championship',
    description: 'Annual inter-college debate championship on contemporary socio-political issues. This year\'s topic: "Should AI be regulated by a global governance body?" Teams of two will compete in British Parliamentary format. Prizes for Best Speaker and Best Team.',
    coverImage: '/images/activities/debate-championship.jpg',
    additionalImages: [],
    date: '2026-08-28',
    time: '10:00 AM',
    location: 'Auditorium, Academic Block',
    status: 'upcoming',
    category: 'Competition',
    createdBy: 'u-002',
    createdAt: '2026-08-08T11:00:00.000Z',
    updatedAt: '2026-08-08T11:00:00.000Z',
  },
  {
    id: 'a-003',
    title: 'Documentary Screening: The Social Dilemma',
    description: 'Movie night with a purpose! We will screen "The Social Dilemma" followed by a moderated group discussion on digital privacy, algorithmic manipulation, and what policy interventions might look like. Snacks will be provided.',
    coverImage: '/images/activities/documentary-screening.jpg',
    additionalImages: [],
    date: '2026-09-05',
    time: '6:00 PM',
    location: 'Media Room, Library Building',
    status: 'upcoming',
    category: 'Screening',
    createdBy: 'u-003',
    createdAt: '2026-08-12T14:00:00.000Z',
    updatedAt: '2026-08-12T14:00:00.000Z',
  },

  // Completed
  {
    id: 'a-004',
    title: 'Budget Analysis Workshop',
    description: 'Hands-on workshop where members analyzed the Union Budget 2026-27. Participants learned to read budget documents, identify allocations for social sectors, and critique fiscal policy decisions. An excellent session with active participation from all attendees.',
    coverImage: '/images/activities/budget-workshop.jpg',
    additionalImages: [],
    date: '2026-07-25',
    time: '3:00 PM',
    location: 'Room 204, Social Sciences Block',
    status: 'completed',
    category: 'Workshop',
    createdBy: 'u-001',
    createdAt: '2026-07-15T10:00:00.000Z',
    updatedAt: '2026-07-26T10:00:00.000Z',
  },
  {
    id: 'a-005',
    title: 'Guest Lecture: Urban Governance',
    description: 'A thought-provoking guest lecture by Prof. Ramesh Iyer on challenges facing urban local bodies in India. Topics covered included municipal finance, smart city initiatives, and citizen participation in urban planning.',
    coverImage: '/images/activities/guest-lecture.jpg',
    additionalImages: [],
    date: '2026-07-18',
    time: '2:00 PM',
    location: 'Lecture Theatre 1',
    status: 'completed',
    category: 'Lecture',
    createdBy: 'u-004',
    createdAt: '2026-07-10T10:00:00.000Z',
    updatedAt: '2026-07-19T10:00:00.000Z',
  },
  {
    id: 'a-006',
    title: 'Club Meeting — Semester Planning',
    description: 'Monthly club meeting to plan activities for the monsoon semester. All members discussed proposals, voted on event ideas, and assigned responsibilities. Minutes of the meeting have been circulated via email.',
    coverImage: '/images/activities/club-meeting.jpg',
    additionalImages: [],
    date: '2026-07-05',
    time: '4:30 PM',
    location: 'Conference Room, Admin Block',
    status: 'completed',
    category: 'Meeting',
    createdBy: 'u-002',
    createdAt: '2026-06-28T10:00:00.000Z',
    updatedAt: '2026-07-06T10:00:00.000Z',
  },
  {
    id: 'a-007',
    title: 'Debate Workshop for Beginners',
    description: 'A foundational workshop on debate techniques, argumentation, and public speaking skills. Members practiced with mock debate rounds and received feedback from senior debaters.',
    coverImage: '/images/activities/debate-workshop.jpg',
    additionalImages: [],
    date: '2026-06-20',
    time: '3:00 PM',
    location: 'Seminar Hall A',
    status: 'completed',
    category: 'Workshop',
    createdBy: 'u-003',
    createdAt: '2026-06-12T10:00:00.000Z',
    updatedAt: '2026-06-21T10:00:00.000Z',
  },

  // Cancelled
  {
    id: 'a-008',
    title: 'Field Visit: State Legislature',
    description: 'Planned educational visit to the State Legislature to observe proceedings. Unfortunately cancelled due to scheduling conflicts with the legislative session calendar.',
    coverImage: '/images/activities/field-visit.jpg',
    additionalImages: [],
    date: '2026-07-10',
    time: '9:00 AM',
    location: 'State Legislature Complex',
    status: 'cancelled',
    category: 'Field Visit',
    createdBy: 'u-001',
    createdAt: '2026-06-25T10:00:00.000Z',
    updatedAt: '2026-07-08T10:00:00.000Z',
  },
];

// ─── Attendance ──────────────────────────────────────────
// Only for completed activities

const allMemberIds = users.map(u => u.id);
const completedActivityIds = activities.filter(a => a.status === 'completed').map(a => a.id);

const attendance = [];
let attendanceCounter = 1;

completedActivityIds.forEach(activityId => {
  allMemberIds.forEach(memberId => {
    // Simulate ~75% attendance rate
    const isPresent = Math.random() < 0.75;
    // Teacher and leadership members almost always attend
    const member = users.find(u => u.id === memberId);
    const isImportant = member?.role === 'teacher_admin' || ['president', 'vice_president', 'general_secretary'].includes(member?.position);
    const status = (isImportant || isPresent) ? 'present' : 'absent';

    attendance.push({
      id: `att-${String(attendanceCounter++).padStart(3, '0')}`,
      activityId,
      memberId,
      status,
      updatedBy: 'u-001',
      updatedAt: activities.find(a => a.id === activityId)?.updatedAt || new Date().toISOString(),
    });
  });
});

// ─── Messages ────────────────────────────────────────────

const messages = [
  {
    id: 'm-001',
    senderId: 'u-001',
    message: 'Hey everyone! Welcome to the new semester. Hope you all had a great break! 🎉',
    createdAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'm-002',
    senderId: 'u-002',
    message: 'Thanks Dhairya! Excited to get back to our activities. The planning meeting was really productive.',
    createdAt: '2026-08-01T10:05:00.000Z',
  },
  {
    id: 'm-003',
    senderId: 'u-005',
    message: 'When is the first event this semester?',
    createdAt: '2026-08-01T10:10:00.000Z',
  },
  {
    id: 'm-004',
    senderId: 'u-001',
    message: 'We have the Public Policy Orientation on August 20th. Perfect for new members to get up to speed!',
    createdAt: '2026-08-01T10:12:00.000Z',
  },
  {
    id: 'm-005',
    senderId: 'u-003',
    message: 'I\'ve also been working on the inter-college debate championship. It\'s going to be amazing!',
    createdAt: '2026-08-01T10:15:00.000Z',
  },
  {
    id: 'm-006',
    senderId: 'u-008',
    message: 'The debate workshop last semester was so helpful. I feel much more confident now.',
    createdAt: '2026-08-02T09:00:00.000Z',
  },
  {
    id: 'm-007',
    senderId: 'u-006',
    message: 'Can we organize a study group for the policy orientation? I want to prepare.',
    createdAt: '2026-08-02T11:30:00.000Z',
  },
  {
    id: 'm-008',
    senderId: 'u-004',
    message: 'Great initiative, Priya! I can share some reading materials in advance.',
    createdAt: '2026-08-02T11:45:00.000Z',
  },
  {
    id: 'm-009',
    senderId: 'u-007',
    message: 'Has anyone seen the documentary we\'re screening? No spoilers please 😂',
    createdAt: '2026-08-03T14:00:00.000Z',
  },
  {
    id: 'm-010',
    senderId: 'u-009',
    message: 'I watched it last year. It\'s eye-opening. The discussion afterwards is going to be great.',
    createdAt: '2026-08-03T14:10:00.000Z',
  },
  {
    id: 'm-011',
    senderId: 'u-010',
    message: 'Quick question — are guests allowed at the debate championship?',
    createdAt: '2026-08-05T16:00:00.000Z',
  },
  {
    id: 'm-012',
    senderId: 'u-002',
    message: 'Yes! It\'s open to the entire college. We\'re expecting teams from 5 other colleges too.',
    createdAt: '2026-08-05T16:15:00.000Z',
  },
  {
    id: 'm-013',
    senderId: 'u-011',
    message: 'I\'m a first year. Is the policy orientation beginner-friendly?',
    createdAt: '2026-08-06T09:30:00.000Z',
  },
  {
    id: 'm-014',
    senderId: 'u-001',
    message: 'Absolutely, Rohan! It\'s specifically designed for new members. No prior knowledge needed.',
    createdAt: '2026-08-06T09:35:00.000Z',
  },
  {
    id: 'm-015',
    senderId: 'u-012',
    message: 'I might write a piece about the debate championship for the college paper. Would that be okay?',
    createdAt: '2026-08-07T13:00:00.000Z',
  },
  {
    id: 'm-016',
    senderId: 'u-003',
    message: 'That would be fantastic, Ishita! Let\'s coordinate so you can cover it properly.',
    createdAt: '2026-08-07T13:10:00.000Z',
  },
  {
    id: 'm-017',
    senderId: 'u-013',
    message: 'Can we add a session on tech policy this semester? I think it\'s really relevant.',
    createdAt: '2026-08-10T11:00:00.000Z',
  },
  {
    id: 'm-018',
    senderId: 'u-004',
    message: 'Excellent suggestion, Aditya. Let\'s discuss this at the next planning meeting.',
    createdAt: '2026-08-10T11:20:00.000Z',
  },
  {
    id: 'm-019',
    senderId: 'u-014',
    message: 'Looking forward to everything this semester. The ethical governance panel sounds amazing.',
    createdAt: '2026-08-12T15:00:00.000Z',
  },
  {
    id: 'm-020',
    senderId: 'u-001',
    message: 'Guys, are we meeting tomorrow at 4 PM for the pre-orientation prep?',
    createdAt: '2026-08-14T16:32:00.000Z',
  },
  {
    id: 'm-021',
    senderId: 'u-002',
    message: 'Yes, I\'ll be there!',
    createdAt: '2026-08-14T16:34:00.000Z',
  },
  {
    id: 'm-022',
    senderId: 'u-005',
    message: 'Count me in. See you all tomorrow.',
    createdAt: '2026-08-14T16:40:00.000Z',
  },
];

module.exports = {
  users,
  activities,
  attendance,
  messages,
};
