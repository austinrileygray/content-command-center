# Get Supabase Database Password

To enable automatic SQL execution, I need your Supabase database password.

## Quick Steps (2 minutes)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Get Database Password:**
   - Click **Settings** (gear icon) in left sidebar
   - Click **Database** 
   - Scroll to **Connection string** section
   - Look for **"Session mode"** or **"Transaction mode"** connection string
   - The password is the part after `postgres:` and before `@`
   
   OR
   
   - Go to **Settings** > **Database** > **Connection string**
   - Copy the password from the connection string
   - Format: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`

3. **Add to `.env.local`:**
   ```env
   SUPABASE_DB_PASSWORD=your_actual_database_password_here
   ```

4. **That's it!** I can now execute SQL automatically.

## Alternative: Connection String

If you see a full connection string, you can extract the password:
```
postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

Just copy the `[PASSWORD]` part.

## After Adding Password

Once you add `SUPABASE_DB_PASSWORD` to `.env.local`, I can:
- ✅ Execute SQL migrations automatically
- ✅ Create/update database tables
- ✅ Set up RLS policies
- ✅ Run any SQL you need

**No more manual SQL execution needed!** 🚀



