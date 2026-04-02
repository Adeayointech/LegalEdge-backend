import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Upload a file buffer to R2.
 * Returns the object key stored in the bucket.
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  return key;
}

/**
 * Generate a pre-signed download URL for an R2 object.
 * Expires in 1 hour by default.
 */
export async function getPresignedDownloadUrl(
  key: string,
  fileName: string,
  expiresInSeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
  });
  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Delete an object from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

/**
 * Build a unique R2 object key for a document.
 */
export function buildR2Key(
  firmId: string,
  caseId: string,
  originalFileName: string
): string {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  // Sanitise the filename — replace spaces/special chars
  const safe = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `documents/${firmId}/${caseId}/${timestamp}-${random}-${safe}`;
}
