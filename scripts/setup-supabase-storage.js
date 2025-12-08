#!/usr/bin/env node

/**
 * Script to automatically set up Supabase Storage bucket for thumbnails
 * Uses Supabase Management API with service role key
 * 
 * Run: node scripts/setup-supabase-storage.js
 */

const { createClient } = require('@supabase/supabase-js')
// Load .env.local manually since dotenv might not be installed
const fs = require('fs')
const path = require('path')

// Simple .env.local parser
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
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nMake sure .env.local exists and contains these values.')
  process.exit(1)
}

// Create Supabase client with service role (admin access)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorageBucket() {
  console.log('🚀 Setting up Supabase Storage for thumbnails...\n')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
      return false
    }

    const existingBucket = buckets.find(b => b.name === 'thumbnails')
    
    if (existingBucket) {
      console.log('✅ Bucket "thumbnails" already exists!')
      console.log('   Checking if it\'s public...')
      
      if (existingBucket.public) {
        console.log('✅ Bucket is already public')
      } else {
        console.log('⚠️  Bucket exists but is not public')
        console.log('   Please make it public in Supabase Dashboard:')
        console.log('   Storage > thumbnails > Settings > Public bucket')
      }
    } else {
      console.log('📦 Creating bucket "thumbnails"...')
      
      // Note: Supabase JS client doesn't have a direct method to create buckets
      // We need to use the REST API directly
      const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY
        },
        body: JSON.stringify({
          name: 'thumbnails',
          public: true,
          file_size_limit: 10485760, // 10MB
          allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('❌ Failed to create bucket:', error)
        console.error('\n💡 You may need to create it manually via Dashboard:')
        console.error('   1. Go to Supabase Dashboard > Storage')
        console.error('   2. Click "New bucket"')
        console.error('   3. Name: thumbnails, Public: Yes')
        return false
      }

      console.log('✅ Bucket "thumbnails" created successfully!')
    }

    // Set up storage policies
    console.log('\n📋 Setting up storage policies...')
    
    const policies = [
      {
        name: 'Allow authenticated uploads',
        definition: `(bucket_id = 'thumbnails')`,
        operation: 'INSERT',
        target: 'authenticated'
      },
      {
        name: 'Allow public read',
        definition: `(bucket_id = 'thumbnails')`,
        operation: 'SELECT',
        target: 'public'
      },
      {
        name: 'Allow users to delete own files',
        definition: `(bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text)`,
        operation: 'DELETE',
        target: 'authenticated'
      }
    ]

    // Note: Policy creation via API is complex, so we'll provide SQL
    console.log('\n📝 Storage policies need to be created via SQL.')
    console.log('   Run this SQL in your Supabase SQL Editor:\n')
    
    policies.forEach((policy, index) => {
      console.log(`-- Policy ${index + 1}: ${policy.name}`)
      console.log(`CREATE POLICY "${policy.name}"`)
      console.log(`ON storage.objects FOR ${policy.operation}`)
      console.log(`TO ${policy.target}`)
      if (policy.operation === 'INSERT') {
        console.log(`WITH CHECK ${policy.definition};`)
      } else {
        console.log(`USING ${policy.definition};`)
      }
      console.log('')
    })

    console.log('✅ Setup instructions complete!')
    console.log('\n🎉 Next steps:')
    console.log('   1. Run the SQL policies above in Supabase SQL Editor')
    console.log('   2. Try uploading a thumbnail in the app')
    
    return true
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

// Run the setup
setupStorageBucket()
  .then(success => {
    if (success) {
      console.log('\n✨ All done!')
    } else {
      console.log('\n⚠️  Some steps may need manual completion.')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })



