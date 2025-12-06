# 🔍 YouTube OAuth 400 Error - Debug Guide

## ✅ Your Google Cloud Console Configuration is CORRECT

You have configured:
- ✅ `https://contentmotor.co/api/youtube/callback`
- ✅ `http://localhost:3000/api/youtube/callback`

These are **EXACTLY** what they should be!

## 🔍 What to Check Next

Since the redirect URIs are correct, the 400 error might be from:

### 1. Check the Actual Redirect URI Being Sent

When you click "Connect" on YouTube:

1. **Open Browser DevTools** (Press F12)
2. Go to **Console** tab
3. Click "Connect" button
4. Look for log messages starting with `[YouTube OAuth]`
5. **Check this line:**
   ```
   [YouTube OAuth] Redirect URI being sent: ...
   ```
6. **Verify it says:** `https://contentmotor.co/api/youtube/callback`

### 2. Verify Client ID Matches

The Client ID must be **EXACTLY**:
```
YOUR_YOUTUBE_CLIENT_ID_HERE
```

In the console logs, you should see:
```
[YouTube OAuth] Client ID (first 30 chars): YOUR_YOUTUBE_CLIENT_ID_HERE
```

### 3. Check for Trailing Slashes or Extra Characters

Even if the URL looks correct, check for:
- Trailing slashes: `https://contentmotor.co/api/youtube/callback/` ❌
- Extra spaces
- URL encoding issues

### 4. Try This Debug Endpoint

After deployment, check what redirect URI is being generated:

1. Go to: `https://contentmotor.co/api/youtube/auth`
2. It should return JSON with `redirectUri` field
3. Verify it's exactly: `https://contentmotor.co/api/youtube/callback`

## 🔧 What I Just Fixed

✅ Improved hostname detection from request
✅ Added detailed logging to see exactly what's being sent
✅ Hardcoded production redirect URI as fallback
✅ Better error messages

## 📝 Next Steps

1. **Wait for deployment to complete** (just deployed)
2. **Clear your browser cache** (Ctrl+Shift+Delete)
3. **Try connecting again**
4. **Check browser console** for the `[YouTube OAuth]` logs
5. **Compare** the redirect URI in logs to what's in Google Cloud Console

## 🚨 If Still Getting 400 Error

Check the browser console logs and tell me:
1. What redirect URI is shown in the logs?
2. What's the exact error message?
3. Is it the same 400 error or different?

---

**The redirect URIs in Google Cloud Console are perfect. Let's see what the app is actually sending!**








