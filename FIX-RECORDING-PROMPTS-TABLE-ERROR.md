# 🔧 Fix: "Could not find the table 'public.recording_editing_prompts'"

## Error Message
```
Could not find the table 'public.recording_editing_prompts' in the schema cache
```

## Cause
The `recording_editing_prompts` table hasn't been created in your Supabase database yet. The migration file exists but needs to be executed.

## Solution

### Step 1: Run the Migration

1. **Open Supabase Dashboard:**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste Migration SQL:**
   - Open the file: `migrations/create-recording-prompt-system.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Migration:**
   - Click "Run" or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
   - Wait for "Success" message

### Step 2: Verify Table Created

Run this query in SQL Editor to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'recording_editing_prompts';
```

You should see one row returned.

### Step 3: Refresh Your App

- Refresh your browser page (`/prompts`)
- The error should be gone
- You can now create prompts!

## Alternative: Run Migration via Script

If you prefer command line:

```bash
npm run db:migrate -- migrations/create-recording-prompt-system.sql
```

## What This Migration Creates

- ✅ `recording_editing_prompts` table
- ✅ Indexes for fast lookups
- ✅ Unique constraint (one active prompt per category)
- ✅ `editing_prompt_id` column in `recordings` table
- ✅ Automatic `updated_at` trigger

---

**After running the migration, the error will be resolved and you can use the prompts page!** 🎉








