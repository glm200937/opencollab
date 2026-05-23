import { Client } from 'minio'

export const minio = new Client({
  endPoint:  process.env.MINIO_ENDPOINT  ?? 'localhost',
  port:      Number(process.env.MINIO_PORT ?? 9000),
  useSSL:    process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
})

export const BUCKET = process.env.MINIO_BUCKET ?? 'opencollab'

// Créer le bucket s'il n'existe pas au démarrage
export async function ensureBucket() {
  const exists = await minio.bucketExists(BUCKET)
  if (!exists) {
    await minio.makeBucket(BUCKET, 'us-east-1')
    console.log(`✅ Bucket MinIO "${BUCKET}" créé`)
  }
}

// Générer une URL présignée pour téléchargement (valide 1h)
export async function getPresignedUrl(objectKey: string): Promise<string> {
  return minio.presignedGetObject(BUCKET, objectKey, 60 * 60)
}

// Supprimer un objet
export async function deleteObject(objectKey: string): Promise<void> {
  await minio.removeObject(BUCKET, objectKey)
}
