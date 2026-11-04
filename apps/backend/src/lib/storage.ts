import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { env } from '../env'

export const s3 = new S3Client({
  region: 'auto',
  endpoint: env.RUSTFS_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.RUSTFS_ACCESS_KEY,
    secretAccessKey: env.RUSTFS_SECRET_KEY,
  },
})

const bucket = env.RUSTFS_BUCKET

export function publicUrl(key: string): string {
  const base = env.RUSTFS_PUBLIC_URL.replace(/\/$/, '')
  return `${base}/${key}`
}

export async function getObject(key: string) {
  return s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  )
}

export async function putObject(key: string, body: Buffer | Uint8Array, contentType: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
