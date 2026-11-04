import { z } from 'zod'

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  CORS_ORIGINS: z.string().default(''),
  RUSTFS_ENDPOINT: z.string().default('http://localhost:9000'),
  RUSTFS_ACCESS_KEY: z.string(),
  RUSTFS_SECRET_KEY: z.string(),
  RUSTFS_BUCKET: z.string().default('abch-website'),
  RUSTFS_PUBLIC_URL: z.string().optional().default('https://portal-api.abchospitaleg.com/v1/storage/public'),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('8h'),
  SEED_ADMIN_PASSWORD: z.string().min(4).default('0000'),
  SEED_CALL_CENTER_PASSWORD: z.string().min(4).default('0000'),
  SEED_MARKETER_PASSWORD: z.string().min(4).default('0000'),
})

export type Env = z.infer<typeof schema>

function load(): Env {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment configuration')
  }
  return parsed.data
}

export const env = load()

export type UserRole = 'admin' | 'call_center' | 'marketer'
