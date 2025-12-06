#!/usr/bin/env node

/**
 * Direct PostgreSQL SQL Execution Script
 * Uses pg library for direct database connection
 * 
 * Requires: npm install pg
 * Requires: SUPABASE_DB_PASSWORD in .env.local
 * 
 * Usage:
 *   node scripts/execute-sql-pg.js "SQL_STATEMENT"
 *   node scripts/execute-sql-pg.js --file path/to/file.sql
 */

// Allow self-signed certificates for Supabase connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

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
// Try database password first, fallback to service role key (may not work for direct DB connection)
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

// Extract project reference
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
if (!projectRef) {
  console.error('❌ Could not extract project reference')
  process.exit(1)
}

// Check if pg is installed
let Client
try {
  const pg = require('pg')
  Client = pg.Client
} catch (error) {
  console.error('❌ pg library not installed')
  console.error('   Install with: npm install pg')
  process.exit(1)
}

/**
 * Execute SQL using direct PostgreSQL connection
 */
async function executeSQL(sql) {
  // Build connection string
  // Supabase connection format:
  // Direct: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
  // Pooler: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
  
  // Try direct connection first (port 5432)
  // If that fails, we'll try the pooler
  const directConnectionString = `postgresql://postgres:${DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`
  
  // Pooler connection (port 6543) - more reliable for connection pooling
  const poolerConnectionString = `postgresql://postgres.${projectRef}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`

  // Try pooler first (more reliable), fallback to direct
  let client = new Client({
    connectionString: poolerConnectionString,
    ssl: { 
      rejectUnauthorized: false,
      require: true
    }
  })
  
  // If pooler fails, we'll try direct connection
  let useDirectConnection = false

  try {
    await client.connect()
    console.log('✅ Connected to Supabase database (via pooler)\n')
  } catch (poolerError) {
    // Try direct connection if pooler fails
    console.log('⚠️  Pooler connection failed, trying direct connection...')
    await client.end().catch(() => {})
    
    client = new Client({
      connectionString: directConnectionString,
      ssl: { 
        rejectUnauthorized: false,
        require: true
      }
    })
    
    try {
      await client.connect()
      console.log('✅ Connected to Supabase database (direct connection)\n')
      useDirectConnection = true
    } catch (directError) {
      // If both fail, check if it's a password issue
      if (directError.code === '28P01' || poolerError.code === '28P01') {
        throw new Error('Authentication failed - need SUPABASE_DB_PASSWORD')
      }
      throw poolerError // Throw original error
    }
  }
  
  try {

    // Clean SQL - remove comments and split by semicolons
    // Remove single-line comments (-- ...) but preserve inline comments after semicolons
    let cleanSQL = sql
      .split('\n')
      .map(line => {
        // Remove full-line comments
        if (line.trim().startsWith('--')) return ''
        // Remove inline comments (-- at end of line)
        const commentIndex = line.indexOf('--')
        if (commentIndex > 0 && !line.substring(0, commentIndex).includes("'")) {
          return line.substring(0, commentIndex).trim()
        }
        return line.trim()
      })
      .filter(line => line.length > 0)
      .join('\n')
      .trim()
    
    // Split by semicolons, but keep multi-line statements together
    const statements = cleanSQL
      .split(';')
      .map(s => s.trim().replace(/\n+/g, ' ').trim())
      .filter(s => s.length > 0 && !s.match(/^\s*$/) && !s.toLowerCase().startsWith('note:'))

    console.log(`📋 Executing ${statements.length} statement(s)...\n`)

    const results = []
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue

      const preview = statement.substring(0, 60).replace(/\n/g, ' ')
      
      try {
        console.log(`[${i + 1}/${statements.length}] Executing...`)
        console.log(`   ${preview}${statement.length > 60 ? '...' : ''}`)

        const result = await client.query(statement)
        results.push({
          statement: preview,
          success: true,
          rowCount: result.rowCount || 0
        })
        console.log(`   ✅ Success (${result.rowCount || 0} rows affected)\n`)
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`)
        results.push({
          statement: preview,
          success: false,
          error: error.message
        })
        // Continue with next statement
      }
    }

    await client.end()

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    console.log('─'.repeat(70))
    console.log(`✅ Completed: ${successCount} succeeded, ${failCount} failed`)
    console.log('─'.repeat(70))

    return {
      success: failCount === 0,
      results,
      successCount,
      failCount
    }
  } catch (error) {
    await client.end().catch(() => {})
    
    if (error.code === '28P01' || error.message.includes('password')) {
      console.error('❌ Authentication failed')
      console.error('   Please check your SUPABASE_DB_PASSWORD in .env.local')
      console.error('   Get password from: Supabase Dashboard > Settings > Database')
    } else {
      console.error('❌ Connection error:', error.message)
    }
    
    return { success: false, error: error.message }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  let sql = ''

  if (args.length === 0) {
    console.error('Usage:')
    console.error('  node scripts/execute-sql-pg.js "SQL_STATEMENT"')
    console.error('  node scripts/execute-sql-pg.js --file path/to/file.sql')
    console.error('')
    console.error('Required:')
    console.error('  - npm install pg')
    console.error('  - SUPABASE_DB_PASSWORD in .env.local')
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

  if (!DB_PASSWORD) {
    console.error('❌ Missing SUPABASE_DB_PASSWORD')
    console.error('   Add to .env.local: SUPABASE_DB_PASSWORD=your_db_password')
    console.error('   Get from: Supabase Dashboard > Settings > Database')
    process.exit(1)
  }

  const result = await executeSQL(sql)
  process.exit(result.success ? 0 : 1)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})


