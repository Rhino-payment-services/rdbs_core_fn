import axios from '@/lib/axios';

const defaultApiBase = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/** Absolute URL for carousel images stored on the API or Cloudinary. */
export function resolveCarouselImageUrl(imageUrl?: string | null): string {
  const value = imageUrl?.trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (value.startsWith('/')) {
    return `${defaultApiBase()}${value}`;
  }
  return value;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const withMessage = error as { message?: unknown };
    if (typeof withMessage.message === 'string' && withMessage.message.trim()) {
      return withMessage.message;
    }
    const axiosLike = error as { response?: { data?: { message?: string } } };
    const backend = axiosLike.response?.data?.message;
    if (backend?.trim()) return backend;
  }
  return fallback;
}

export async function uploadCarouselImage(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const apiBase = defaultApiBase();

  if (cloudName && uploadPreset) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData },
    );

    if (!response.ok) {
      throw new Error('Cloudinary image upload failed');
    }

    const data = (await response.json()) as { secure_url?: string };
    if (!data.secure_url) {
      throw new Error('Cloudinary did not return an image URL');
    }
    return data.secure_url;
  }

  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axios.post<{ imageUrl: string }>(
    '/carousel/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  const imageUrl = data.imageUrl;
  if (!imageUrl) {
    throw new Error('Server did not return an image URL');
  }
  return imageUrl.startsWith('http') ? imageUrl : `${apiBase}${imageUrl}`;
}

export function toDateTimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocalValue(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}
