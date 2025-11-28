# Automated Supabase Storage Setup

## Quick Setup (Using Script)

I've created an automated script that will help set up the storage bucket for you!

### Step 1: Run the Setup Script

```bash
npm run setup:storage
```

This script will:
- ✅ Check if the bucket exists
- ✅ Create the bucket if it doesn't exist
- ✅ Provide the exact SQL policies you need to run

### Step 2: Run the SQL Policies

The script will output the exact SQL you need to run. Copy and paste it into your Supabase SQL Editor:

1. Go to Supabase Dashboard > SQL Editor
2. Paste the SQL from the script output
3. Click "Run"

### That's It!

After running the script and SQL, your storage is ready to use.

---

## Alternative: Manual Setup

If the script doesn't work, use the manual setup in `SETUP-SUPABASE-STORAGE.md`.

---

## Troubleshooting

### Script Error: "Missing environment variables"
- Make sure `.env.local` exists in the project root
- Verify it contains `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Script Error: "Failed to create bucket"
- The Supabase Management API might have restrictions
- Use the manual Dashboard method instead (see `SETUP-SUPABASE-STORAGE.md`)

### Bucket Created But Policies Fail
- Make sure you're running the SQL in the correct Supabase project
- Check that you have admin access to the project
