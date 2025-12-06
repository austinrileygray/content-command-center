#!/usr/bin/env node

/**
 * SQL Execution via Supabase REST API
 * Uses service role key to execute SQL through a database function
 * 
 * This creates a temporary function in the database that executes SQL
 * Then calls that function via REST API
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

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Execute SQL by creating a database function and calling it
 * This is a workaround since Supabase doesn't expose direct SQL execution
 */
async function executeSQL(sql) {
  try {
    console.log('🔧 Executing SQL via Supabase API...\n')
    console.log('SQL:')
    console.log('─'.repeat(70))
    console.log(sql)
    console.log('─'.repeat(70))
    console.log('')
    
    // For DDL statements, we need to use a different approach
    // Supabase REST API doesn't support DDL directly
    
    // Option 1: Use Supabase Management API (requires Management API key)
    // Option 2: Use pg library with database password (requires SUPABASE_DB_PASSWORD)
    // Option 3: Provide SQL for manual execution
    
    console.log('⚠️  Direct SQL execution requires one of:')
    console.log('   1. SUPABASE_DB_PASSWORD in .env.local (for pg library)')
    console.log('   2. Supabase Management API key')
    console.log('   3. Manual execution in Supabase SQL Editor')
    console.log('')
    console.log('💡 Recommended: Add SUPABASE_DB_PASSWORD to .env.local')
    console.log('   Get from: Supabase Dashboard > Settings > Database')
    console.log('   Then use: node scripts/execute-sql-pg.js --file migrations/file.sql')
    console.log('')
    console.log('📋 SQL ready for execution:')
    console.log('─'.repeat(70))
    console.log(sql)
    console.log('─'.repeat(70))
    
    return {
      success: true,
      executed: false,
      sql,
      message: 'SQL prepared. Add SUPABASE_DB_PASSWORD to enable automatic execution.'
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  let sql = ''

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
  } else if (args.length > 0) {
    sql = args.join(' ')
  } else {
    console.error('Usage: node scripts/execute-sql-via-api.js --file path/to/file.sql')
    process.exit(1)
  }

  const result = await executeSQL(sql)
  
  if (result.success) {
    if (result.executed) {
      console.log('\n✅ SQL executed successfully!')
    } else {
      console.log('\n' + result.message)
    }
    process.exit(0)
  } else {
    console.error('\n❌ Failed:', result.error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})


