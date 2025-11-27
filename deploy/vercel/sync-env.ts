#!/usr/bin/env node
/**
 * Syncs Vercel environment variables to .env.production file
 * 
 * This script reads environment variables from Vercel's runtime environment
 * and writes them to .env.production, allowing existing scripts that use
 * `dotenv -e .env.production` to work seamlessly on Vercel.
 * 
 * Usage: tsx deploy/vercel/sync-env.ts
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

/**
 * List of environment variables to sync from Vercel to .env.production
 */
const ENV_VAR_NAMES = [
  // Database
  'DATABASE_URL',
  
  // Authentication
  'SESSION_SECRET',
  
  // Email (Brevo)
  'BREVO_API_KEY',
  'BREVO_SENDER_EMAIL',
  'BREVO_SENDER_NAME',
  'EMAIL_PROVIDER',
  
  // App Configuration
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_FORCE_GUEST_MODE',
  'NEXT_PUBLIC_MAILHOG_HTTP_URL',
  
  // Mailhog (for development/testing)
  'MAILHOG_HOST',
  'MAILHOG_PORT',
  'MAILHOG_USERNAME',
  'MAILHOG_PASSWORD',
  
  // Node Environment
  'NODE_ENV',
  
  // Vercel-specific (optional, for reference)
  'VERCEL',
  'VERCEL_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
] as const

/**
 * Escapes special characters in environment variable values
 */
function escapeEnvValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\$/g, '\\$')    // Escape dollar signs
}

/**
 * Syncs environment variables from process.env to .env.production file
 */
export function syncVercelEnvToFile(): void {
  const envVars: string[] = []
  let syncedCount = 0
  
  // Read from process.env and write to file
  for (const varName of ENV_VAR_NAMES) {
    const value = process.env[varName]
    if (value !== undefined && value !== '') {
      const escapedValue = escapeEnvValue(value)
      envVars.push(`${varName}="${escapedValue}"`)
      syncedCount++
    }
  }
  
  if (envVars.length === 0) {
    return
  }
  
  // Write to .env.production
  const envFilePath = join(process.cwd(), '.env.production')
  const envContent = envVars.join('\n') + '\n'
  
  try {
    writeFileSync(envFilePath, envContent, 'utf-8')
  } catch {
    process.exit(1)
  }
}

// Run the sync if called directly
if (require.main === module) {
  syncVercelEnvToFile()
}

