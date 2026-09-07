import { getInitials } from '../../utils/helpers';
import PositionBadge from './PositionBadge';
import './MemberCard.css';

export default function MemberCard({ member, showBio = false }) {
  const isLeadership = member.role === 'teacher_admin' || ['president', 'vice_president', 'general_secretary'].includes(member.position);

  return (
    <div className={`member-card ${isLeadership ? 'member-card--leadership' : ''} card-surface animate-fade-in`}>
      <div className="member-card__avatar-frame">
        {member.profileImage ? (
          <img src={member.profileImage} alt={member.name} className="member-card__img" />
        ) : (
          <div className="member-card__initials">{getInitials(member.name)}</div>
        )}
      </div>
      <div className="member-card__info">
        <div className="member-card__badge-row">
          <PositionBadge position={member.position} role={member.role} size="sm" />
        </div>
        <h3 className="member-card__name">{member.name}</h3>
        {member.course && (
          <p className="member-card__detail member-card__course">{member.course}</p>
        )}
        {member.year && (
          <p className="member-card__detail member-card__year">{member.year}</p>
        )}
        {showBio && member.bio && (
          <p className="member-card__bio">{member.bio}</p>
        )}
      </div>
    </div>
  );
}
