import { minioClient, AUDIO_BUCKET, TRACKER_BUCKET } from '../config/minio';

export async function uploadAudioToMinio(
  buffer: Buffer,
  mimetype: string,
): Promise<string> {
  const baseMime = mimetype.split(';')[0].trim();
  const ext =
    baseMime === 'audio/webm' ? '.webm'
    : baseMime === 'audio/ogg' ? '.ogg'
    : baseMime === 'audio/mpeg' ? '.mp3'
    : '.webm';
  const key = `audio-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  await minioClient.putObject(AUDIO_BUCKET, key, buffer, buffer.length, {
    'Content-Type': baseMime,
  });
  return key;
}

export async function streamAudioFromMinio(
  key: string,
): Promise<{ stream: NodeJS.ReadableStream; size: number; contentType: string }> {
  const stat = await minioClient.statObject(AUDIO_BUCKET, key);
  const stream = await minioClient.getObject(AUDIO_BUCKET, key);
  const contentType =
    (stat.metaData?.['content-type'] as string | undefined) ?? 'audio/webm';
  return { stream, size: stat.size, contentType };
}

export async function uploadScreenshotToMinio(
  buffer: Buffer,
  mimetype: string,
): Promise<string> {
  const baseMime = mimetype.split(';')[0].trim();
  const ext =
    baseMime === 'image/webp' ? '.webp'
    : baseMime === 'image/png' ? '.png'
    : '.jpg';
  const key = `screenshot-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  await minioClient.putObject(TRACKER_BUCKET, key, buffer, buffer.length, {
    'Content-Type': baseMime,
  });
  return key;
}

export async function streamScreenshotFromMinio(
  key: string,
): Promise<{ stream: NodeJS.ReadableStream; size: number; contentType: string }> {
  const stat = await minioClient.statObject(TRACKER_BUCKET, key);
  const stream = await minioClient.getObject(TRACKER_BUCKET, key);
  const contentType =
    (stat.metaData?.['content-type'] as string | undefined) ?? 'image/jpeg';
  return { stream, size: stat.size, contentType };
}

export async function deleteScreenshotFromMinio(key: string) {
  await minioClient.removeObject(TRACKER_BUCKET, key);
}
