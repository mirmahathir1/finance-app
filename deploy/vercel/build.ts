#!/usr/bin/env node
/**
 * Vercel Build Script
 * 
 * This script orchestrates the build process for Vercel deployments:
 * 1. Syncs Vercel environment variables to .env.production
 * 2. Generates Prisma Client
 * 3. Runs database migrations
 * 4. Builds the Next.js application
 * 
 * Usage: tsx deploy/vercel/build.ts
 */

import { execSync } from 'child_process'
import { syncVercelEnvToFile } from './sync-env'

/**
 * Executes a command and handles errors
 */
function execCommand(command: string, _description: string): void {
  try {
    execSync(command, {
      stdio: 'inherit',
      env: process.env,
    })
  } catch {
    process.exit(1)
  }
}

/**
 * Main build function
 */
async function build(): Promise<void> {
  try {
    // Step 1: Sync environment variables
    syncVercelEnvToFile()
    
    // Verify DATABASE_URL is set before proceeding
    if (!process.env.DATABASE_URL) {
      process.exit(1)
    }
    
    // Step 2: Generate Prisma Client
    // Use npx prisma generate directly since env vars are already in process.env
    execCommand(
      'npx prisma generate',
      'Generating Prisma Client'
    )
    
    // Step 3: Run database migrations
    // Use npx prisma migrate deploy directly since env vars are already in process.env
    execCommand(
      'npx prisma migrate deploy',
      'Running database migrations'
    )
    
    // Step 4: Build Next.js application
    // Use next build directly with --webpack flag for PWA support
    // The .env.production file has already been created in Step 1
    execCommand(
      'npx next build --webpack',
      'Building Next.js application'
    )
  } catch {
    process.exit(1)
  }
}

// Run the build
void build()

