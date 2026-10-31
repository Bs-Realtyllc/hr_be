import { minioClient, AUDIO_BUCKET } from '../config/minio';

export async function uploadAudioToMinio(
  buffer: Buffer,
  mimetype: string,
): Promise<string> {
  const ext =
    mimetype === 'audio/webm' ? '.webm'
    : mimetype === 'audio/ogg' ? '.ogg'
    : mimetype === 'audio/mpeg' ? '.mp3'
    : '.webm';
  const key = `audio-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  await minioClient.putObject(AUDIO_BUCKET, key, buffer, buffer.length, {
    'Content-Type': mimetype,
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
