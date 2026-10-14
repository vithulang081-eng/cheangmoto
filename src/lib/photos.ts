import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export const MAX_GALLERY_PHOTOS = 3;
const BUCKET = 'mechanic-photos';
/** Rider profile photos share the shop-photo bucket: its policies already let a signed-in user write to their own folder. */
export const AVATAR_BUCKET = BUCKET;

/** Lets the rider pick up to `limit` photos from the library. Returns local URIs ([] if cancelled). */
export async function pickPhotos(limit: number): Promise<string[]> {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!granted) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.7,
    exif: false,
  });
  if (result.canceled) return [];
  return result.assets.slice(0, limit).map((a) => a.uri);
}

/** Takes a photo with the camera. Returns the local URI or null. */
export async function takePhoto(): Promise<string | null> {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) return null;
  const result = await ImagePicker.launchCameraAsync({ quality: 0.7, exif: false });
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

/**
 * Uploads a local image to Storage under the signed-in user's folder and returns its public URL.
 * Demo mode keeps the local URI so the flow still works without a backend.
 */
export async function uploadPhoto(localUri: string, userId: string, bucket: string = BUCKET): Promise<string> {
  if (!supabase) return localUri;
  const response = await fetch(localUri);
  const bytes = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType, upsert: false });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
