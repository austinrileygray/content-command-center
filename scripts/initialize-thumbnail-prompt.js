#!/usr/bin/env node

/**
 * Script to initialize thumbnail prompts from markdown file
 * Usage: node scripts/initialize-thumbnail-prompt.js [category] [file]
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

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
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function initializePrompt(category, megaPrompt) {
  console.log(`\n🔧 Initializing ${category} thumbnail prompt...\n`)

  // Use Claude to break the mega prompt into modular sections
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Analyze this thumbnail generation prompt for ${category} content and break it into modular sections.

MEGA PROMPT:
${megaPrompt}

Break this prompt into logical, independent sections that can be updated separately. Common sections include:
- color_palette: Color schemes, brand colors, contrast requirements
- text_style: Font choices, text placement, word limits
- layout: Composition rules, element placement, rule of thirds
- visual_elements: Subject positioning, background style, props
- emotion_tone: Emotional impact, mood, energy level
- technical_specs: Resolution, aspect ratio, file format requirements
- best_practices: General guidelines, what to avoid, proven patterns
- thumbnail_formulas: Specific formulas and structures
- element_library: Visual elements to include
- language_guidelines: Industry-specific terminology

Return a JSON object with this structure:
{
  "sections": {
    "section_name": {
      "content": "Detailed content for this section...",
      "last_updated": "${new Date().toISOString()}",
      "updated_by": "initial"
    }
  }
}

Return ONLY the JSON object, no other text.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${error}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Parse the JSON response
  let parsedSections
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsedSections = JSON.parse(jsonMatch[0])
    } else {
      parsedSections = JSON.parse(content)
    }
  } catch (parseError) {
    throw new Error(`Failed to parse prompt sections: ${parseError.message}`)
  }

  // Get user profile
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .limit(1)

  if (!profiles || profiles.length === 0) {
    throw new Error("User not found")
  }

  const userId = profiles[0].id

  // Check if template already exists
  const { data: existing } = await supabase
    .from("thumbnail_prompt_templates")
    .select("id, version_number")
    .eq("user_id", userId)
    .eq("category", category)
    .eq("is_active", true)
    .single()

  if (existing) {
    console.log(`⚠️  Prompt template already exists (version ${existing.version_number})`)
    console.log('   Use update endpoint or delete existing template first')
    return
  }

  // Create initial template
  const { data: template, error: templateError } = await supabase
    .from("thumbnail_prompt_templates")
    .insert({
      user_id: userId,
      category,
      sections: parsedSections.sections,
      version_number: 1,
      is_active: true,
    })
    .select()
    .single()

  if (templateError) {
    throw new Error(`Failed to create template: ${templateError.message}`)
  }

  // Save to version history
  await supabase.from("thumbnail_prompt_versions").insert({
    user_id: userId,
    category,
    sections: parsedSections.sections,
    version_number: 1,
    change_summary: "Initial prompt template created from OWNROPS mega prompt",
    change_type: "initial",
    changed_sections: Object.keys(parsedSections.sections),
    created_by: "user",
  })

  console.log(`✅ Prompt initialized successfully!`)
  console.log(`   Category: ${category}`)
  console.log(`   Sections created: ${Object.keys(parsedSections.sections).length}`)
  console.log(`   Version: 1`)
  console.log(`\n   Sections:`)
  Object.keys(parsedSections.sections).forEach(section => {
    console.log(`   - ${section}`)
  })
}

async function main() {
  const args = process.argv.slice(2)
  const category = args[0] || 'youtube'
  const filePath = args[1] || 'OWNROPS-THUMBNAIL-PROMPT.md'

  if (!['youtube', 'short_form'].includes(category)) {
    console.error('❌ Category must be "youtube" or "short_form"')
    process.exit(1)
  }

  const fullPath = path.isAbsolute(filePath) 
    ? filePath 
    : path.join(process.cwd(), filePath)

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`)
    process.exit(1)
  }

  const megaPrompt = fs.readFileSync(fullPath, 'utf8')

  try {
    await initializePrompt(category, megaPrompt)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()



