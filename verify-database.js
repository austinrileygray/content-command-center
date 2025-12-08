// Quick script to verify Supabase database setup
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sfwslpahuxcofwnyoukg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmd3NscGFodXhjb2Z3bnlvdWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzQyMzIsImV4cCI6MjA3OTg1MDIzMn0.o7dgmKv7MnSx56FuW1nWWZAEvPHVa_nabol_3w6Yspo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');

  const tables = [
    'profiles',
    'content_ideas',
    'guests',
    'recordings',
    'assets',
    'publishing_queue',
    'analytics_snapshots'
  ];

  const results = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116') {
          results[table] = { exists: false, error: 'Table not found' };
        } else {
          results[table] = { exists: true, error: error.message };
        }
      } else {
        results[table] = { exists: true, count: data?.length || 0 };
      }
    } catch (err) {
      results[table] = { exists: false, error: err.message };
    }
  }

  // Check for sample data
  console.log('📊 Table Status:\n');
  for (const [table, result] of Object.entries(results)) {
    if (result.exists) {
      console.log(`✅ ${table.padEnd(25)} - EXISTS`);
      if (result.count !== undefined) {
        console.log(`   Sample data: ${result.count > 0 ? '✅ Found' : '⚠️  No data'}`);
      }
    } else {
      console.log(`❌ ${table.padEnd(25)} - NOT FOUND`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  }

  // Check profiles and content_ideas specifically
  console.log('\n📋 Data Verification:\n');
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profiles && profiles.length > 0) {
    console.log(`✅ Profiles: ${profiles.length} found`);
    profiles.forEach(p => {
      console.log(`   - ${p.name} (${p.email})`);
    });
  } else {
    console.log('⚠️  No profiles found');
  }

  const { data: ideas, error: ideasError } = await supabase
    .from('content_ideas')
    .select('*');

  if (ideas && ideas.length > 0) {
    console.log(`\n✅ Content Ideas: ${ideas.length} found`);
    ideas.forEach(idea => {
      console.log(`   - "${idea.title}" (${idea.status})`);
    });
  } else {
    console.log('\n⚠️  No content ideas found');
  }

  console.log('\n✨ Verification complete!');
}

verifyDatabase().catch(console.error);



