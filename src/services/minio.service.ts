import path from 'path';
import { minioClient, AUDIO_BUCKET, TRACKER_BUCKET, ISSUE_ATTACHMENTS_BUCKET } from '../config/minio';

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

export async function uploadIssueAttachmentToMinio(
  buffer: Buffer,
  mimetype: string,
  originalName: string,
): Promise<string> {
  const ext = path.extname(originalName);
  const key = `attachment-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  await minioClient.putObject(ISSUE_ATTACHMENTS_BUCKET, key, buffer, buffer.length, {
    'Content-Type': mimetype,
  });
  return key;
}

export async function streamIssueAttachmentFromMinio(
  key: string,
): Promise<{ stream: NodeJS.ReadableStream; size: number; contentType: string }> {
  const stat = await minioClient.statObject(ISSUE_ATTACHMENTS_BUCKET, key);
  const stream = await minioClient.getObject(ISSUE_ATTACHMENTS_BUCKET, key);
  const contentType =
    (stat.metaData?.['content-type'] as string | undefined) ?? 'application/octet-stream';
  return { stream, size: stat.size, contentType };
}

export async function deleteIssueAttachmentFromMinio(key: string) {
  await minioClient.removeObject(ISSUE_ATTACHMENTS_BUCKET, key);
}
