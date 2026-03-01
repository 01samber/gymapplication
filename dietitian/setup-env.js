#!/usr/bin/env node
/**
 * Copies Supabase env from admin to dietitian if dietitian/.env.local is missing.
 * Run from project root: node dietitian/setup-env.js
 */
const fs = require('fs')
const path = require('path')

const adminEnv = path.join(__dirname, '../admin/.env.local')
const dietitianEnv = path.join(__dirname, '.env.local')

if (fs.existsSync(dietitianEnv)) {
  console.log('dietitian/.env.local already exists.')
  process.exit(0)
}

if (!fs.existsSync(adminEnv)) {
  console.log('admin/.env.local not found. Create it first with Supabase URL and keys.')
  process.exit(1)
}

const content = fs.readFileSync(adminEnv, 'utf8')
const lines = content.split('\n').filter(line => {
  const trimmed = line.trim()
  return trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=') || trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')
})

if (lines.length < 2) {
  console.log('admin/.env.local missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

fs.writeFileSync(dietitianEnv, lines.join('\n') + '\n')
console.log('Created dietitian/.env.local from admin. Restart the dietitian server.')
process.exit(0)
