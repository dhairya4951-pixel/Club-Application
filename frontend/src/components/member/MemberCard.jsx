import { getInitials, getPositionLabel } from '../../utils/helpers';
import PositionBadge from './PositionBadge';
import './MemberCard.css';

export default function MemberCard({ member, showBio = false }) {
  return (
    <div className="member-card animate-fade-in">
      <div className="member-card__avatar">
        {member.profileImage ? (
          <img src={member.profileImage} alt={member.name} />
        ) : (
          <span className="member-card__initials">{getInitials(member.name)}</span>
        )}
      </div>
      <div className="member-card__info">
        <h3 className="member-card__name">{member.name}</h3>
        <PositionBadge position={member.position} role={member.role} />
        {member.course && (
          <p className="member-card__detail">{member.course}</p>
        )}
        {member.year && (
          <p className="member-card__detail">{member.year}</p>
        )}
        {showBio && member.bio && (
          <p className="member-card__bio">{member.bio}</p>
        )}
      </div>
    </div>
  );
}
