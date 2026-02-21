import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ANTHROPIC_API_KEY: z.string().optional(),
})

function validateEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Environment validation failed:\n${errors}`)
  }

  const env = result.data

  return env
}

// Validate on import (fails fast at startup)
export const env = validateEnv()
