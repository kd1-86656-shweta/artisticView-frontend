import { useRef, useState, type FormEvent } from 'react';
import Avatar from '@/components/common/Avatar';
import ImageUpload from '@/components/form/ImageUpload';
import { useAppSelector } from '@/store';
import { useCommunitiesQuery } from '@/store/communityApi';
import { useCreatePostMutation, useUpdatePostMutation } from '@/store/postApi';
import type { Post, PostRequest } from '@/types/api';
import { toApiError } from '@/utils/errors';
import { uploadVideo } from '@/utils/uploadVideo';

interface PostComposerProps {
  /** Post into this community; when absent the author picks one of theirs, or their profile. */
  communitySlug?: string;
  /** Edit an existing post instead of creating one. */
  editing?: Post;
  onDone?: (post: Post) => void;
  onCancel?: () => void;
}

const VIDEO_TYPES = 'video/mp4,video/quicktime,video/webm';
const MAX_VIDEO_MB = 100;

/** Title, text and an image or a video. Collapsed to one line until clicked when creating. */
export default function PostComposer({ communitySlug, editing, onDone, onCancel }: PostComposerProps) {
  const me = useAppSelector((s) => s.auth.session!.user);
  const token = useAppSelector((s) => s.auth.accessToken);
  const [open, setOpen] = useState(Boolean(editing));
  const [target, setTarget] = useState(communitySlug ?? '');
  const [title, setTitle] = useState(editing?.title ?? '');
  const [body, setBody] = useState(editing?.body ?? '');
  const [media, setMedia] = useState<'image' | 'video'>(editing?.videoUrl ? 'video' : 'image');
  const [image, setImage] = useState<{ key?: string; url: string | null }>({ url: editing?.imageUrl ?? null });
  const [video, setVideo] = useState<{ key?: string; url: string | null }>({ url: editing?.videoUrl ?? null });
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const { data: joined } = useCommunitiesQuery({ scope: 'mine' }, { skip: Boolean(communitySlug) || Boolean(editing) });
  const [create, creating] = useCreatePostMutation();
  const [update, updating] = useUpdatePostMutation();

  const reset = () => {
    setTitle(''); setBody(''); setImage({ url: null }); setVideo({ url: null }); setError(null); setOpen(false);
  };

  const pickVideo = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!VIDEO_TYPES.split(',').includes(file.type)) return setError('Use an MP4, MOV or WebM video');
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) return setError(`Videos can be up to ${MAX_VIDEO_MB} MB`);
    setProgress(0);
    try {
      const result = await uploadVideo(file, token, setProgress);
      setVideo({ key: result.key, url: result.url });
      setImage({ key: image.url ? '' : undefined, url: null });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProgress(null);
      if (videoInput.current) videoInput.current.value = '';
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!title.trim()) return setError('Give your post a title');
    if (progress !== null) return setError('Wait for the video to finish uploading');
    const request: PostRequest = { title: title.trim(), body };
    if (image.key !== undefined) request.imageKey = image.key;
    if (video.key !== undefined) request.videoKey = video.key;
    try {
      const saved = editing
        ? await update({ id: editing.id, body: request }).unwrap()
        : await create({ ...request, communitySlug: target || undefined }).unwrap();
      if (!editing) reset();
      onDone?.(saved);
    } catch (err) {
      setError(toApiError(err as never)?.message ?? 'Could not save the post');
    }
  };

  if (!open) {
    return (
      <button type="button" className="composer-collapsed" onClick={() => setOpen(true)}>
        <Avatar name={me.displayName} url={me.avatarUrl} size={36} />
        <span>Create a post{communitySlug ? ` in c/${communitySlug}` : ''}…</span>
        <i className="bi bi-image ms-auto" /><i className="bi bi-camera-video" />
      </button>
    );
  }

  const saving = creating.isLoading || updating.isLoading;

  return (
    <form className="card border-0 shadow-sm" onSubmit={onSubmit} noValidate>
      <div className="card-body p-3 p-md-4 d-grid gap-3">
        {error && <div className="alert alert-danger mb-0 py-2">{error}</div>}
        {!communitySlug && !editing && (
          <select className="form-select" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Post to">
            <option value="">My profile</option>
            {joined?.map((c) => <option key={c.slug} value={c.slug}>c/{c.slug}</option>)}
          </select>
        )}
        <input className="form-control form-control-lg" placeholder="Title" maxLength={300} value={title}
               onChange={(e) => setTitle(e.target.value)} autoFocus={!editing} />
        <textarea className="form-control" rows={4} maxLength={10000} placeholder="Text (optional)" value={body}
                  onChange={(e) => setBody(e.target.value)} />

        <div className="ev-segmented align-self-start">
          <button type="button" className={media === 'image' ? 'is-on' : ''} onClick={() => setMedia('image')}><i className="bi bi-image me-1" />Image</button>
          <button type="button" className={media === 'video' ? 'is-on' : ''} onClick={() => setMedia('video')}><i className="bi bi-camera-video me-1" />Video</button>
        </div>
        {media === 'image' ? (
          <ImageUpload kind="POST" shape="wide" label="Add an image" url={image.url}
                       onChange={(key, url) => { setImage({ key, url }); if (key && video.url) setVideo({ key: '', url: null }); }} />
        ) : (
          <div>
            {video.url ? (
              <video className="post-media" src={video.url} controls preload="metadata" />
            ) : (
              <button type="button" className="img-upload img-upload--wide w-100" onClick={() => videoInput.current?.click()} disabled={progress !== null}>
                <span className="img-upload__empty">
                  <i className="bi bi-camera-video fs-3" />
                  <span>{progress !== null ? `Uploading… ${progress}%` : 'Add a video'}</span>
                  <small>MP4, MOV or WebM, up to {MAX_VIDEO_MB} MB</small>
                </span>
              </button>
            )}
            {progress !== null && <div className="progress mt-2" style={{ height: 6 }}><div className="progress-bar" style={{ width: `${progress}%` }} /></div>}
            {video.url && <button type="button" className="btn btn-sm btn-link text-danger p-0 mt-2" onClick={() => setVideo({ key: '', url: null })}>Remove video</button>}
            <input ref={videoInput} type="file" accept={VIDEO_TYPES} hidden onChange={(e) => pickVideo(e.target.files?.[0])} />
          </div>
        )}

        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="btn btn-outline-secondary" onClick={() => (editing ? onCancel?.() : reset())}>Cancel</button>
          <button type="submit" className="btn btn-join px-4" disabled={saving || progress !== null}>
            {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {editing ? 'Save' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  );
}
