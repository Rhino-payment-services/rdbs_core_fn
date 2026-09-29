import axios from '@/lib/axios';

const defaultApiBase = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function resolveMiniAppIconUrl(iconUrl?: string | null): string {
  const value = iconUrl?.trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (value.startsWith('/')) {
    return `${defaultApiBase()}${value}`;
  }
  return value;
}

export function getMiniAppApiError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const axiosLike = error as { response?: { data?: { message?: string | string[] } } };
    const backend = axiosLike.response?.data?.message;
    if (Array.isArray(backend) && backend[0]) return backend[0];
    if (typeof backend === 'string' && backend.trim()) return backend;
  }
  return fallback;
}

export async function uploadMiniAppIcon(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axios.post<{ iconUrl: string }>(
    '/admin/mini-apps/upload-icon',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  if (!data.iconUrl) {
    throw new Error('Server did not return an icon URL');
  }
  return data.iconUrl.startsWith('http')
    ? data.iconUrl
    : `${defaultApiBase()}${data.iconUrl}`;
}
