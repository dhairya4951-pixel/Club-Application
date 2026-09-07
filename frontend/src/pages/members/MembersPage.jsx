import { useState, useEffect } from 'react';
import { memberService } from '../../services/memberService';
import MemberCard from '../../components/member/MemberCard';
import Loading from '../../components/common/Loading';
import Icon from '../../components/common/Icon';
import './MembersPage.css';

const LEADERSHIP_POSITIONS = ['president', 'vice_president', 'general_secretary'];

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchMembers() {
      try {
        const data = await memberService.getAll();
        setMembers(data);
      } catch (err) {
        console.error('Failed to load members:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  const leadership = members.filter(m =>
    m.role === 'teacher_admin' || LEADERSHIP_POSITIONS.includes(m.position)
  );

  // Sort leadership: Teacher first, then President, VP, General Secretary
  const positionOrder = { 'teacher_admin': 1, 'president': 2, 'vice_president': 3, 'general_secretary': 4 };
  leadership.sort((a, b) => {
    const orderA = a.role === 'teacher_admin' ? 1 : positionOrder[a.position] || 99;
    const orderB = b.role === 'teacher_admin' ? 1 : positionOrder[b.position] || 99;
    return orderA - orderB;
  });

  const normalMembers = members.filter(m =>
    m.role !== 'teacher_admin' && !LEADERSHIP_POSITIONS.includes(m.position)
  );

  const filteredMembers = normalMembers.filter(m =>
    !search ||
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.course?.toLowerCase().includes(search.toLowerCase()) ||
    m.year?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading fullPage message="Loading member directory..." />;

  return (
    <div className="container members-page">
      <div className="page-header">
        <span className="eyebrow-label">Club Directory</span>
        <h1>Members & Leadership</h1>
        <p>Meet the faculty advisor, student executive officers, and active members of the Public Policy Club.</p>
      </div>

      {/* Leadership Section */}
      {leadership.length > 0 && (
        <section className="members-section">
          <div className="members-section__header">
            <h2 className="section-title">Leadership</h2>
            <span className="members-count-badge">{leadership.length} Officers</span>
          </div>
          <div className="grid-4 leadership-grid">
            {leadership.map((member) => (
              <div key={member.id} className="leadership-col">
                <MemberCard member={member} showBio={true} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* General Members Section */}
      <section className="members-section">
        <div className="members-section__header members-section__header--split">
          <div className="members-section__title-wrap">
            <h2 className="section-title">General Members</h2>
            <span className="members-count-badge">{normalMembers.length} Members</span>
          </div>

          <div className="members-search-wrap">
            <Icon name="search" size={15} className="members-search-icon" />
            <input
              type="text"
              placeholder="Search by name or course..."
              className="members-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="members-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <Icon name="x" size={13} />
              </button>
            )}
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="members-empty card-surface">
            <p>No members found matching &ldquo;{search}&rdquo;.</p>
          </div>
        ) : (
          <div className="grid-4 members-grid">
            {filteredMembers.map((member) => (
              <div key={member.id}>
                <MemberCard member={member} showBio={false} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
