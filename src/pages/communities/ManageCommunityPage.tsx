import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';
import { useAppSelector } from '@/store';
import { useLazyCheckUsernameQuery } from '@/store/authApi';
import {
  useAddMemberMutation,
  useCommunityQuery,
  useDeleteCommunityMutation,
  useMembersQuery,
  useRemoveMemberMutation,
  useSetMemberRoleMutation,
  useUpdateCommunityMutation,
} from '@/store/communityApi';
import type { CommunityMember } from '@/types/api';
import { toApiError } from '@/utils/errors';
import CommunityForm from './CommunityForm';

const ROLE_LABEL = { OWNER: 'Owner', MODERATOR: 'Moderator', MEMBER: 'Member' } as const;

/** Owners and moderators: edit details, add / remove members, pick moderators (owner), delete (owner). */
export default function ManageCommunityPage() {
  const slug = useParams().slug!;
  const navigate = useNavigate();
  const me = useAppSelector((s) => s.auth.session!.user);
  const { data: c, isLoading } = useCommunityQuery(slug);
  const { data: members } = useMembersQuery(slug, { skip: !c?.canModerate });
  const [update, updating] = useUpdateCommunityMutation();
  const [addMember, adding] = useAddMemberMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [setRole] = useSetMemberRoleMutation();
  const [deleteCommunity, deleting] = useDeleteCommunityMutation();
  const [checkUsername] = useLazyCheckUsernameQuery();
  const [tab, setTab] = useState<'members' | 'details'>('members');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState<{ kind: 'success' | 'danger'; text: string } | null>(null);

  if (isLoading) return <div className="placeholder-glow"><span className="placeholder col-12 rounded-4" style={{ height: 300 }} /></div>;
  if (!c || !c.canModerate) return <div className="alert alert-warning">Only the owner and moderators can manage this community.</div>;
  const owner = c.myRole === 'OWNER';

  const run = async (action: () => Promise<unknown>, success?: string) => {
    setMessage(null);
    try {
      await action();
      if (success) setMessage({ kind: 'success', text: success });
    } catch (err) {
      setMessage({ kind: 'danger', text: toApiError(err as never)?.message ?? 'Something went wrong' });
    }
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const name = username.trim().replace(/^@/, '').toLowerCase();
    if (!name) return;
    await run(async () => {
      const check = await checkUsername(name).unwrap();
      if (check.available) throw { data: { error: { code: 'BAD_REQUEST', message: `No member called @${name}` } }, status: 400 };
      await addMember({ slug, username: name }).unwrap();
      setUsername('');
    }, `Invite sent to @${name}. They join once they accept.`);
  };

  const canRemove = (m: CommunityMember) =>
    m.role !== 'OWNER' && m.user.id !== me.id && (owner || m.role === 'MEMBER');

  return (
    <div className="row justify-content-center">
      <div className="col-lg-9 d-grid gap-3">
        <Link to={`/c/${slug}`} className="small text-body-secondary"><i className="bi bi-arrow-left me-1" />c/{slug}</Link>
        <h1 className="display-6 page-title mb-0">Manage {c.name}</h1>
        <ul className="nav ev-tabs">
          <li className="nav-item"><button className={`nav-link ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}><i className="bi bi-people me-1" />Members</button></li>
          <li className="nav-item"><button className={`nav-link ${tab === 'details' ? 'active' : ''}`} onClick={() => setTab('details')}><i className="bi bi-pencil me-1" />Details</button></li>
        </ul>
        {message && <div className={`alert alert-${message.kind} mb-0`}>{message.text}</div>}

        {tab === 'members' ? (
          <section className="card border-0 shadow-sm"><div className="card-body p-4 d-grid gap-3">
            <form className="input-group" style={{ maxWidth: 480 }} onSubmit={add}>
              <span className="input-group-text">@</span>
              <input className="form-control" placeholder="Add a member by username" value={username}
                     onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} />
              <button className="btn btn-join px-3" disabled={adding.isLoading || !username.trim()}>Add</button>
            </form>
            <div className="d-grid gap-2">
              {members?.map((m) => (
                <div key={m.user.id} className="d-flex flex-wrap align-items-center gap-3 py-2 border-bottom">
                  <Avatar name={m.user.displayName} url={m.user.avatarUrl} size={40} />
                  <div className="flex-grow-1 min-w-0">
                    <Link to={`/users/${m.user.username}`} className="fw-semibold text-reset">{m.user.displayName}</Link>
                    <div className="small text-body-secondary">@{m.user.username} · {ROLE_LABEL[m.role]}{m.status === 'INVITED' && ' · invite pending'}</div>
                  </div>
                  {owner && m.status === 'ACTIVE' && m.role !== 'OWNER' && (
                    <button className="btn btn-sm btn-outline-primary"
                            onClick={() => run(() => setRole({ slug, userId: m.user.id, role: m.role === 'MODERATOR' ? 'MEMBER' : 'MODERATOR' }).unwrap(),
                              m.role === 'MODERATOR' ? `${m.user.displayName} is a member again` : `${m.user.displayName} is now a moderator`)}>
                      {m.role === 'MODERATOR' ? 'Remove moderator' : 'Make moderator'}
                    </button>
                  )}
                  {canRemove(m) && (
                    <button className="btn btn-sm btn-outline-danger"
                            onClick={() => window.confirm(`Remove ${m.user.displayName}?`) && run(() => removeMember({ slug, userId: m.user.id }).unwrap())}>
                      {m.status === 'INVITED' ? 'Cancel invite' : 'Remove'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div></section>
        ) : (
          <>
            <CommunityForm existing={c} saving={updating.isLoading} submitLabel="Save changes"
                           onSubmit={(body) => run(() => update({ slug, body }).unwrap(), 'Saved')} />
            {owner && (
              <section className="card border-danger-subtle"><div className="card-body p-4">
                <h2 className="h6 fw-bold text-danger">Delete community</h2>
                <p className="small text-body-secondary">Removes the community with all its posts and comments. This cannot be undone.</p>
                <button className="btn btn-outline-danger" disabled={deleting.isLoading} onClick={() => {
                  if (window.prompt(`Type ${c.slug} to confirm`) !== c.slug) return;
                  run(async () => { await deleteCommunity(slug).unwrap(); navigate('/communities', { replace: true }); });
                }}>Delete c/{c.slug}</button>
              </div></section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
