# 🌐 Setting Up contentmotor.co Domain on Vercel

## Current Status
The domain `contentmotor.co` is already assigned to another Vercel project. We need to either:
1. Remove it from the other project and add it to this one
2. Or configure it via the Vercel Dashboard

## Option 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Navigate to your project: `content-command-center`

2. **Add Domain:**
   - Go to **Settings** → **Domains**
   - Click **Add Domain**
   - Enter: `contentmotor.co`
   - Click **Add**

3. **Add WWW Subdomain:**
   - Also add: `www.contentmotor.co`
   - Vercel will automatically redirect one to the other

4. **Configure DNS:**
   - Vercel will show you DNS records to add
   - Go to your domain registrar (where you bought contentmotor.co)
   - Add these DNS records:
     - **A Record**: `@` → `76.76.21.21` (or the IP Vercel provides)
     - **CNAME Record**: `www` → `cname.vercel-dns.com` (or what Vercel shows)

## Option 2: Remove from Other Project First

If you want to use CLI:

1. **Find the other project:**
   ```bash
   npx vercel project ls
   ```

2. **Remove domain from other project:**
   ```bash
   npx vercel domains rm contentmotor.co --project <other-project-name>
   ```

3. **Add to this project:**
   ```bash
   npx vercel domains add contentmotor.co
   npx vercel domains add www.contentmotor.co
   ```

## After Domain is Configured

Once the domain is working:

1. **Update YouTube OAuth Redirect URI:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Edit your OAuth 2.0 Client ID
   - Add these redirect URIs:
     ```
     https://contentmotor.co/api/youtube/callback
     https://www.contentmotor.co/api/youtube/callback
     http://localhost:3000/api/youtube/callback
     ```
   - Save changes

2. **Update Environment Variables (if needed):**
   - The app automatically detects the domain from request headers
   - No code changes needed!

3. **Deploy:**
   ```bash
   npx vercel --prod
   ```

## Verify Domain is Working

1. Wait for DNS propagation (can take up to 48 hours, usually much faster)
2. Visit: https://contentmotor.co
3. You should see your app!

## Current Production URLs

Your app is currently accessible at:
- https://content-command-center-e0ynu10og-austins-projects-c461c44a.vercel.app

After domain setup, it will also be at:
- https://contentmotor.co
- https://www.contentmotor.co (redirects to contentmotor.co)



