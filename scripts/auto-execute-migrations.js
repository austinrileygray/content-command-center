#!/usr/bin/env node

/**
 * Auto-execute pending migrations
 * This script will execute any SQL files in the migrations/ directory
 * that haven't been executed yet
 * 
 * Usage: node scripts/auto-execute-migrations.js
 */

const fs = require('fs')
const path = require('path')

// Check if pg is available
let canExecute = false
try {
  require('pg')
  canExecute = true
} catch {
  console.log('⚠️  pg library not installed - will prepare SQL for manual execution')
}

const migrationsDir = path.join(process.cwd(), 'migrations')
const executedFile = path.join(process.cwd(), '.migrations-executed.json')

// Get list of executed migrations
function getExecutedMigrations() {
  if (fs.existsSync(executedFile)) {
    try {
      return JSON.parse(fs.readFileSync(executedFile, 'utf8'))
    } catch {
      return []
    }
  }
  return []
}

// Mark migration as executed
function markExecuted(migrationFile) {
  const executed = getExecutedMigrations()
  if (!executed.includes(migrationFile)) {
    executed.push(migrationFile)
    fs.writeFileSync(executedFile, JSON.stringify(executed, null, 2))
  }
}

// Get all SQL files in migrations directory
function getMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) {
    return []
  }
  
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
}

async function main() {
  console.log('🔍 Checking for pending migrations...\n')
  
  const migrationFiles = getMigrationFiles()
  const executed = getExecutedMigrations()
  const pending = migrationFiles.filter(file => !executed.includes(file))
  
  if (pending.length === 0) {
    console.log('✅ All migrations are up to date!')
    return
  }
  
  console.log(`📋 Found ${pending.length} pending migration(s):`)
  pending.forEach(file => console.log(`   - ${file}`))
  console.log('')
  
  if (canExecute) {
    console.log('🚀 Executing migrations...\n')
    
    // Use the pg-based script
    for (const file of pending) {
      const filePath = path.join(migrationsDir, file)
      console.log(`\n📄 Executing: ${file}`)
      console.log('─'.repeat(70))
      
      // Execute using the pg script
      const { execSync } = require('child_process')
      try {
        execSync(`node scripts/execute-sql-pg.js --file "${filePath}"`, {
          stdio: 'inherit'
        })
        markExecuted(file)
        console.log(`✅ ${file} executed successfully\n`)
      } catch (error) {
        console.error(`❌ Failed to execute ${file}`)
        console.error('   Continuing with next migration...\n')
      }
    }
  } else {
    console.log('📝 Preparing SQL for execution...\n')
    
    // Combine all pending migrations
    let combinedSQL = `-- Auto-generated migration script\n`
    combinedSQL += `-- Generated: ${new Date().toISOString()}\n`
    combinedSQL += `-- Files: ${pending.join(', ')}\n\n`
    
    for (const file of pending) {
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      combinedSQL += `-- ============================================\n`
      combinedSQL += `-- Migration: ${file}\n`
      combinedSQL += `-- ============================================\n\n`
      combinedSQL += sql
      combinedSQL += `\n\n`
    }
    
    // Write combined SQL
    const outputFile = path.join(process.cwd(), 'migrations-combined.sql')
    fs.writeFileSync(outputFile, combinedSQL)
    
    console.log(`✅ Combined SQL written to: ${outputFile}`)
    console.log('\n💡 To execute:')
    console.log('   1. Copy the SQL from migrations-combined.sql')
    console.log('   2. Paste into Supabase SQL Editor')
    console.log('   3. Click "Run"')
    console.log('\n   Or install pg library: npm install pg')
    console.log('   Then add SUPABASE_DB_PASSWORD to .env.local')
    console.log('   Then run: node scripts/auto-execute-migrations.js')
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
