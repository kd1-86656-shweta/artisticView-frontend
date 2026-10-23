import { useEffect, useState, type FormEvent } from 'react';
import ImageUpload from '@/components/form/ImageUpload';
import type { Community, CommunityRequest } from '@/types/api';

/** Turns a name into the web address part, the same way the server does. */
export function slugify(name: string): string {
  return name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '').slice(0, 36).replace(/-+$/, '');
}

interface CommunityFormProps {
  existing?: Community;
  saving: boolean;
  submitLabel: string;
  onSubmit: (body: CommunityRequest) => void;
}

/** Shared by "Create community" and the details tab of "Manage community". */
export default function CommunityForm({ existing, saving, submitLabel, onSubmit }: CommunityFormProps) {
  const [name, setName] = useState(existing?.name ?? '');
  const [slug, setSlug] = useState(existing?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(existing));
  const [description, setDescription] = useState(existing?.description ?? '');
  const [rules, setRules] = useState(existing?.rules ?? '');
  const [visibility, setVisibility] = useState<Community['visibility']>(existing?.visibility ?? 'PUBLIC');
  const [cover, setCover] = useState<{ key?: string; url: string | null }>({ url: existing?.coverUrl ?? null });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 3) return setError('The name needs at least 3 characters');
    if (!existing && !/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) return setError('The address needs 3-40 lower-case letters, numbers or dashes');
    const body: CommunityRequest = { name: name.trim(), description, rules, visibility };
    if (!existing) body.slug = slug;
    if (cover.key !== undefined) body.coverKey = cover.key;
    onSubmit(body);
  };

  return (
    <form onSubmit={submit} noValidate className="d-grid gap-4">
      {error && <div className="alert alert-danger mb-0">{error}</div>}
      <section className="card border-0 shadow-sm"><div className="card-body p-4">
        <label className="form-label fw-medium">Cover image <span className="text-body-secondary fw-normal">(optional)</span></label>
        <ImageUpload kind="COMMUNITY" shape="banner" label="Add a cover image" url={cover.url} onChange={(key, url) => setCover({ key, url })} />

        <div className="mt-3 mb-3">
          <label htmlFor="name" className="form-label fw-medium">Name</label>
          <input id="name" className="form-control form-control-lg" maxLength={80} value={name} placeholder="e.g. Budnix Cypher Crew"
                 onChange={(e) => setName(e.target.value)} autoFocus={!existing} />
        </div>
        {!existing ? (
          <div className="mb-3">
            <label htmlFor="slug" className="form-label fw-medium">Web address</label>
            <div className="input-group">
              <span className="input-group-text">artisticview/c/</span>
              <input id="slug" className="form-control" maxLength={40} value={slug}
                     onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }} />
            </div>
            <div className="form-text">This can't be changed later.</div>
          </div>
        ) : (
          <p className="small text-body-secondary">Address: c/{existing.slug}</p>
        )}
        <div className="mb-3">
          <label htmlFor="description" className="form-label fw-medium">What is it about?</label>
          <textarea id="description" className="form-control" rows={3} maxLength={2000} value={description}
                    placeholder="Who is this community for, and what happens here?" onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label htmlFor="rules" className="form-label fw-medium">Rules <span className="text-body-secondary fw-normal">(optional)</span></label>
          <textarea id="rules" className="form-control" rows={4} maxLength={4000} value={rules}
                    placeholder={'1. Be kind\n2. Credit other artists\n3. No spam'} onChange={(e) => setRules(e.target.value)} />
        </div>
      </div></section>

      <section className="card border-0 shadow-sm"><div className="card-body p-4">
        <h2 className="h6 fw-bold mb-3">Who can join</h2>
        <div className="d-grid gap-2">
          {([['PUBLIC', 'globe', 'Public', 'Anyone can see posts and join.'], ['PRIVATE', 'lock', 'Private', 'Only members see posts. People join when you add them.']] as const).map(([v, icon, label, hint]) => (
            <label key={v} className={`vis-option ${visibility === v ? 'is-on' : ''}`}>
              <input type="radio" name="visibility" className="form-check-input mt-0" checked={visibility === v} onChange={() => setVisibility(v)} />
              <span><strong><i className={`bi bi-${icon} me-1`} />{label}</strong><br /><small className="text-body-secondary">{hint}</small></span>
            </label>
          ))}
        </div>
      </div></section>

      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-join btn-lg px-4" disabled={saving}>
          {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}{submitLabel}
        </button>
      </div>
    </form>
  );
}
