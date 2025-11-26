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
function execCommand(command: string, description: string): void {
  console.log(`\n📦 ${description}...`)
  try {
    execSync(command, {
      stdio: 'inherit',
      env: process.env,
    })
    console.log(`✅ ${description} completed`)
  } catch (error) {
    console.error(`❌ ${description} failed:`, error)
    process.exit(1)
  }
}

/**
 * Main build function
 */
async function build(): Promise<void> {
  console.log('🚀 Starting Vercel build process...\n')
  
  try {
    // Step 1: Sync environment variables
    console.log('📝 Syncing environment variables...')
    syncVercelEnvToFile()
    
    // Verify DATABASE_URL is set before proceeding
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set')
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
    
    console.log('\n🎉 Build completed successfully!')
  } catch (error) {
    console.error('\n❌ Build failed:', error)
    process.exit(1)
  }
}

// Run the build
void build()

