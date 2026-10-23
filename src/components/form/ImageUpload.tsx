import { useRef, useState } from 'react';
import { useUploadImageMutation } from '@/store/profileApi';
import type { MediaKind } from '@/types/api';
import { toApiError } from '@/utils/errors';

interface ImageUploadProps {
  kind: MediaKind;
  /** Current image to show (existing URL or the one just uploaded). */
  url: string | null;
  /** Called with the new media key and URL, or ('', null) when the image is removed. */
  onChange: (key: string, url: string | null) => void;
  shape?: 'circle' | 'wide' | 'banner';
  label?: string;
}

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_MB = 8;

/** Pick, preview and upload an image. The server resizes and crops it for its kind. */
export default function ImageUpload({ kind, url, onChange, shape = 'wide', label = 'Upload image' }: ImageUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [upload, { isLoading }] = useUploadImageMutation();
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handle = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!ACCEPT.split(',').includes(file.type)) return setError('Use a JPG, PNG or WebP image');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Images can be up to ${MAX_MB} MB`);
    try {
      const result = await upload({ file, kind }).unwrap();
      onChange(result.key, result.url);
    } catch (err) {
      setError(toApiError(err as never)?.message ?? 'Upload failed');
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      <div
        className={`img-upload img-upload--${shape} ${dragging ? 'is-dragging' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={url ? `Change ${label.toLowerCase()}` : label}
        onClick={() => !isLoading && input.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
      >
        {url ? <img src={url} alt="" /> : (
          <span className="img-upload__empty">
            <i className="bi bi-image fs-3" />
            <span>{label}</span>
            <small>JPG, PNG or WebP, up to {MAX_MB} MB</small>
          </span>
        )}
        {isLoading && <span className="img-upload__busy"><span className="spinner-border" aria-hidden="true" /></span>}
        {url && !isLoading && <span className="img-upload__hover"><i className="bi bi-camera me-1" />Change</span>}
      </div>
      <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => handle(e.target.files?.[0])} />
      <div className="d-flex gap-2 mt-2 align-items-center">
        {url && <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => onChange('', null)}>Remove</button>}
        {error && <small className="text-danger">{error}</small>}
      </div>
    </div>
  );
}
