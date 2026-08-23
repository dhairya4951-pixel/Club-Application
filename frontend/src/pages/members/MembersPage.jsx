import { useState, useEffect } from 'react';
import { memberService } from '../../services/memberService';
import MemberCard from '../../components/member/MemberCard';
import Loading from '../../components/common/Loading';
import './MembersPage.css';

const LEADERSHIP_POSITIONS = ['president', 'vice_president', 'general_secretary'];

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Leadership = teacher + students with leadership positions
  const leadership = members.filter(m =>
    m.role === 'teacher_admin' || LEADERSHIP_POSITIONS.includes(m.position)
  );
  const normalMembers = members.filter(m =>
    m.role !== 'teacher_admin' && !LEADERSHIP_POSITIONS.includes(m.position)
  );

  if (loading) return <Loading fullPage message="Loading members..." />;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Club Members</h1>
        <p>Meet the team behind the Public Policy Club</p>
      </div>

      {/* Leadership */}
      {leadership.length > 0 && (
        <section className="members-section">
          <h2 className="section-title">🏛️ Leadership</h2>
          <div className="grid-4">
            {leadership.map((member, i) => (
              <div key={member.id} style={{ opacity: 0, animation: `slideUp 400ms ease forwards ${i * 100}ms` }}>
                <MemberCard member={member} showBio />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Members */}
      {normalMembers.length > 0 && (
        <section className="members-section">
          <h2 className="section-title">👥 Members</h2>
          <div className="grid-4">
            {normalMembers.map((member, i) => (
              <div key={member.id} style={{ opacity: 0, animation: `slideUp 400ms ease forwards ${i * 80}ms` }}>
                <MemberCard member={member} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
