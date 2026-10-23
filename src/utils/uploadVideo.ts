import type { ApiEnvelope, MediaUpload } from '@/types/api';

/**
 * Uploads a post video with progress reporting. RTK Query's fetch cannot report upload progress, and videos can
 * be up to 100 MB, so this uses XMLHttpRequest directly with the in-memory access token.
 */
export function uploadVideo(file: File, accessToken: string | null, onProgress: (percent: number) => void): Promise<MediaUpload> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/v1/media/videos');
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: ApiEnvelope<MediaUpload> | undefined;
      try {
        body = JSON.parse(xhr.responseText);
      } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300 && body?.data) resolve(body.data);
      else if (xhr.status === 401) reject(new Error('Your session expired. Refresh the page and try again.'));
      else reject(new Error(body?.error?.message ?? `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Cannot reach the server. Check your connection and try again.'));
    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}
