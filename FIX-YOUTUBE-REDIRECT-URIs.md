# 🔧 Fix: YouTube Redirect URI - No Wildcards Allowed

## ❌ The Problem

YouTube API **does NOT allow wildcards (*)** in redirect URIs. The URL you're trying to add:
```
https://content-command-center-*.vercel.app/api/youtube/callback
```

Will be rejected because of the `*` character.

## ✅ The Solution

**Remove the wildcard URI** and **only add these two specific URLs:**

### Correct Redirect URIs to Add:

1. **Production URL:**
   ```
   https://contentmotor.co/api/youtube/callback
   ```

2. **Local Development URL:**
   ```
   http://localhost:3000/api/youtube/callback
   ```

## 📝 Steps to Fix Right Now:

1. **In Google Cloud Console** (where you're seeing the error):
   - **Delete/Remove** the URI with the wildcard: `https://content-command-center-*.vercel.app/api/youtube/callback`
   
2. **Add only these two URLs:**
   - Click **"+ Add URI"** button
   - Type: `https://contentmotor.co/api/youtube/callback`
   - Click **"+ Add URI"** again
   - Type: `http://localhost:3000/api/youtube/callback`

3. **Click "Save"**

4. **Done!** The error should disappear.

## 🎯 Why This Works:

- **Production**: `https://contentmotor.co/api/youtube/callback` - This is your main production URL
- **Localhost**: `http://localhost:3000/api/youtube/callback` - For local development

You don't need preview deployment URLs for MVP. Just use production and localhost.

---

**After fixing this, go back to your app and try connecting YouTube again!**








