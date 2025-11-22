/**
 * TypeScript types for Vercel deployment configuration
 */

/**
 * Environment variable names used in Vercel deployments
 */
export type VercelEnvVarName =
  | 'DATABASE_URL'
  | 'SESSION_SECRET'
  | 'BREVO_API_KEY'
  | 'BREVO_SENDER_EMAIL'
  | 'BREVO_SENDER_NAME'
  | 'EMAIL_PROVIDER'
  | 'NEXT_PUBLIC_APP_URL'
  | 'NEXT_PUBLIC_FORCE_GUEST_MODE'
  | 'NEXT_PUBLIC_MAILHOG_HTTP_URL'
  | 'MAILHOG_HOST'
  | 'MAILHOG_PORT'
  | 'MAILHOG_USERNAME'
  | 'MAILHOG_PASSWORD'
  | 'NODE_ENV'
  | 'VERCEL'
  | 'VERCEL_URL'
  | 'VERCEL_PROJECT_PRODUCTION_URL'

/**
 * Vercel build configuration
 */
export interface VercelBuildConfig {
  buildCommand: string
  devCommand: string
  installCommand: string
  framework: string
  outputDirectory?: string
}

/**
 * Environment variable mapping
 */
export interface EnvVarMapping {
  [key: string]: string | undefined
}

