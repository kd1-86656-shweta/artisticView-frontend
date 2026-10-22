import Avatar from '@/components/common/Avatar';
import { usePermission } from '@/features/auth/permissions';
import { useFollowMutation } from '@/store/homeApi';
import type { PersonCard } from '@/types/api';

export default function PersonCardTile({ person }: { person: PersonCard }) {
  const canFollow = usePermission('USER_FOLLOW');
  const [follow, { isLoading }] = useFollowMutation();

  return (
    <div className="d-flex align-items-start gap-3">
      <Avatar name={person.displayName || person.username} url={person.avatarUrl} size={48} />
      <div className="flex-grow-1 min-w-0">
        <div className="fw-semibold text-truncate">{person.displayName}</div>
        <small className="text-body-secondary">@{person.username} · {person.followerCount} followers</small>
        {person.interests.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mt-1">
            {person.interests.slice(0, 3).map((i) => (
              <span key={i} className="badge rounded-pill interest-chip">{i}</span>
            ))}
          </div>
        )}
      </div>
      {canFollow && (
        <button
          className={`btn btn-sm rounded-pill ${person.followedByMe ? 'btn-outline-secondary' : 'btn-primary'}`}
          disabled={isLoading}
          onClick={() => follow({ userId: person.id, follow: !person.followedByMe })}
        >
          {person.followedByMe ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}
