# Google OAuth Setup Guide for Haliothub Connect

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your project ID

### 1.2 Enable Google+ API
1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API" 
3. Click "Enable"

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add these Authorized redirect URIs:
   - `https://naflfrbgnuvhyrmbjabe.supabase.co/auth/v1/callback`
   - `http://localhost:8080/auth/callback` (for development)
5. Copy your Client ID and Client Secret

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/naflfrbgnuvhyrmbjabe
2. Navigate to "Authentication" → "Providers"
3. Find "Google" and toggle it ON
4. Enter your Google OAuth credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
5. Click "Save"

### 2.2 Configure Site URL
1. In Supabase Dashboard → "Authentication" → "URL Configuration"
2. Set **Site URL** to: `http://localhost:8080` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:8080/**`
   - `https://yourdomain.com/**` (for production)

## Step 3: Test Google Authentication

### 3.1 Development Testing
1. Start your development server: `npm run dev`
2. Go to `http://localhost:8080/auth`
3. Click "Continue with Google"
4. Complete Google OAuth flow
5. You should be redirected back to your app

### 3.2 Production Deployment
When deploying to production:
1. Update Google Cloud Console redirect URIs
2. Update Supabase Site URL and Redirect URLs
3. Test the production flow

## Step 4: Troubleshooting

### Common Issues:
1. **"redirect_uri_mismatch"**: Check redirect URIs in Google Cloud Console
2. **"invalid_client"**: Verify Client ID and Secret in Supabase
3. **"access_denied"**: User cancelled OAuth flow
4. **Profile not created**: Check database trigger is working

### Debug Steps:
1. Check browser console for errors
2. Verify Supabase logs in dashboard
3. Test with different Google accounts
4. Ensure all URLs match exactly

## Step 5: Additional Configuration

### 5.1 Customize OAuth Scopes
You can modify the `handleGoogleAuth` function to request additional scopes:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/`,
    scopes: 'openid email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
});
```

### 5.2 Handle OAuth Callback
The app will automatically handle the OAuth callback and redirect users to the home page.

## Security Notes:
- Never expose Client Secret in frontend code
- Use HTTPS in production
- Regularly rotate OAuth credentials
- Monitor OAuth usage in Google Cloud Console
