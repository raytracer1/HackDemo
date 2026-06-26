import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const URL_EXPIRY = 3600; // 1 hour

/**
 * Upload a buffer to R2.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/**
 * Generate a pre-signed upload URL (PUT) for an R2 object.
 * Extension uploads directly to R2, no body limits.
 */
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2, command, { expiresIn: 300 }); // 5 min expiry
}

/**
 * Generate a pre-signed download URL for an R2 object.
 */
export async function getR2Url(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(r2, command, { expiresIn: URL_EXPIRY });
}

/**
 * Upload a screenshot from a Buffer.
 */
export async function uploadScreenshot(
  demoId: string,
  stepIndex: number,
  buffer: Buffer
): Promise<string> {
  const key = `demos/${demoId}/screenshots/${stepIndex}.png`;
  await uploadToR2(key, buffer, 'image/png');
  return key;
}

/**
 * Upload an audio file from a Buffer.
 */
export async function uploadAudio(
  demoId: string,
  stepIndex: number,
  buffer: Buffer
): Promise<string> {
  const key = `demos/${demoId}/audio/${stepIndex}.mp3`;
  await uploadToR2(key, buffer, 'audio/mpeg');
  return key;
}
