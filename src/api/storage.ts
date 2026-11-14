import { supabase } from '@/lib/supabase';

const STORE_MEDIA_BUCKET = 'store-media';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 1600;

export class UploadError extends Error {
  code: 'type' | 'size' | 'failed';
  constructor(code: 'type' | 'size' | 'failed') {
    super(code);
    this.code = code;
  }
}

async function optimizeImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export async function uploadStoreImage(file: File, folder: string): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new UploadError('type');
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('size');

  const body = await optimizeImage(file);
  const extension = body.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(STORE_MEDIA_BUCKET).upload(path, body, {
    cacheControl: '31536000',
    contentType: body.type || file.type,
    upsert: false,
  });
  if (error) throw new UploadError('failed');

  return supabase.storage.from(STORE_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
