import { Client } from 'minio';

export const minioClient = new Client({
  endPoint:  process.env.MINIO_ENDPOINT || 'localhost',
  port:      parseInt(process.env.MINIO_PORT || '9100'),
  useSSL:    process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'hr-platform',
  secretKey: process.env.MINIO_SECRET_KEY || 'hr-platform-secret-2024',
});

export const AUDIO_BUCKET = process.env.MINIO_AUDIO_BUCKET || 'inbox-audio';

export async function ensureAudioBucket() {
  const exists = await minioClient.bucketExists(AUDIO_BUCKET);
  if (!exists) await minioClient.makeBucket(AUDIO_BUCKET, 'us-east-1');
}
