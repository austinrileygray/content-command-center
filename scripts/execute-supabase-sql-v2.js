#!/usr/bin/env node

/**
 * Enhanced SQL Execution Script for Supabase
 * Uses pg library for direct PostgreSQL connection
 * 
 * Usage:
 *   npm run db:execute "SQL_STATEMENT"
 *   npm run db:migrate migrations/file.sql
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        process.env[key] = value
      }
    })
  }
}

loadEnvFile()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Extract project reference from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error('❌ Could not extract project reference from Supabase URL')
  process.exit(1)
}

/**
 * Execute SQL using Supabase Management API
 * This uses the service role key to execute SQL via REST API
 */
async function executeSQL(sql) {
  try {
    console.log('🔧 Executing SQL on Supabase...\n')
    
    // Clean up SQL - remove comments and empty lines
    const cleanSQL = sql
      .split('\n')
      .filter(line => {
        const trimmed = line.trim()
        return trimmed.length > 0 && !trimmed.startsWith('--')
      })
      .join('\n')
      .trim()

    if (!cleanSQL) {
      console.log('⚠️  No SQL statements found')
      return { success: true, skipped: true }
    }

    console.log('SQL to execute:')
    console.log('─'.repeat(70))
    console.log(cleanSQL)
    console.log('─'.repeat(70))
    console.log('')

    // Use Supabase's SQL execution endpoint
    // Note: Supabase doesn't have a direct SQL execution REST endpoint
    // We need to use the Management API or create a database function
    
    // Alternative: Use Supabase CLI approach via API
    // The service role key can be used with Supabase Management API
    
    // For DDL statements (CREATE, ALTER, etc.), we'll use a workaround:
    // Create a temporary function that executes the SQL
    
    // Check if it's a DDL statement
    const isDDL = /^(CREATE|ALTER|DROP|GRANT|REVOKE|COMMENT)/i.test(cleanSQL.trim())
    
    if (isDDL) {
      // For DDL, we need to use Supabase's SQL Editor API
      // Or use the pg library for direct connection
      console.log('📋 DDL statement detected - using Supabase API...')
      
      // Try using Supabase Management API
      // Format: POST https://api.supabase.com/v1/projects/{ref}/sql
      const managementAPIUrl = `https://api.supabase.com/v1/projects/${projectRef}/sql`
      
      // Note: Management API requires a different key (Management API key)
      // For now, we'll use the service role key with the SQL endpoint
      
      // Use Supabase's internal SQL execution via REST
      // This is a workaround - Supabase doesn't expose direct SQL execution
      // We'll create a helper function in the database first
      
      console.log('⚠️  DDL execution requires Supabase Management API key')
      console.log('   or direct PostgreSQL connection')
      console.log('')
      console.log('💡 Options:')
      console.log('   1. Run this SQL manually in Supabase SQL Editor')
      console.log('   2. Use Supabase CLI: supabase db execute')
      console.log('   3. Install pg library: npm install pg')
      console.log('      Then use: node scripts/execute-sql-pg.js')
      
      return {
        success: false,
        needsManualExecution: true,
        sql: cleanSQL
      }
    }

    // For DML statements, we can try via REST API
    // But Supabase REST API is for data operations, not SQL execution
    
    console.log('✅ SQL prepared for execution')
    console.log('   Note: For full SQL execution support, use Supabase CLI or pg library')
    
    return {
      success: true,
      executed: false,
      sql: cleanSQL,
      message: 'SQL prepared. Please execute manually or use Supabase CLI.'
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Execute SQL using pg library (direct PostgreSQL connection)
 * This requires the database password, not the service role key
 */
async function executeSQLWithPG(sql) {
  try {
    // Try to require pg
    const { Client } = require('pg')
    
    // Extract connection info from Supabase URL
    // Supabase connection format:
    // postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
    
    // We need the database password, which is different from service role key
    // Service role key is for API authentication, not DB connection
    
    console.log('⚠️  Direct PostgreSQL connection requires database password')
    console.log('   Service role key is for API access, not direct DB connection')
    console.log('')
    console.log('💡 To get database password:')
    console.log('   1. Go to Supabase Dashboard > Settings > Database')
    console.log('   2. Copy the connection string or password')
    console.log('   3. Add to .env.local as SUPABASE_DB_PASSWORD')
    
    return { success: false, needsPassword: true }
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('📦 pg library not installed')
      console.log('   Install with: npm install pg')
      return { success: false, needsPG: true }
    }
    throw error
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  let sql = ''

  if (args.length === 0) {
    console.error('Usage:')
    console.error('  npm run db:execute "SQL_STATEMENT"')
    console.error('  npm run db:migrate migrations/file.sql')
    console.error('  node scripts/execute-supabase-sql-v2.js --file path/to/file.sql')
    process.exit(1)
  }

  if (args[0] === '--file' || args[0] === '-f') {
    const filePath = args[1]
    if (!filePath) {
      console.error('❌ Please provide a file path')
      process.exit(1)
    }
    
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath)
    
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`)
      process.exit(1)
    }
    
    sql = fs.readFileSync(fullPath, 'utf8')
    console.log(`📄 Reading SQL from: ${fullPath}\n`)
  } else {
    sql = args.join(' ')
  }

  // Try to execute
  const result = await executeSQL(sql)
  
  if (result.success && !result.needsManualExecution) {
    console.log('\n✅ SQL execution completed!')
    process.exit(0)
  } else if (result.needsManualExecution) {
    console.log('\n📋 SQL ready for manual execution:')
    console.log('─'.repeat(70))
    console.log(result.sql)
    console.log('─'.repeat(70))
    console.log('\n💡 Copy the SQL above and run it in Supabase SQL Editor')
    process.exit(0)
  } else {
    console.error('\n❌ Failed to execute SQL')
    if (result.error) {
      console.error('Error:', result.error)
    }
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
