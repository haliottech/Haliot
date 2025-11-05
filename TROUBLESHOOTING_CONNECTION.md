# Troubleshooting Supabase Connection Timeout Errors

## Understanding the Error

The `ERR_CONNECTION_TIMED_OUT` error indicates that your application cannot connect to your Supabase project. This is typically a network or configuration issue.

## Common Causes & Solutions

### 1. **Missing Environment Variables**

**Check:**
- Ensure you have a `.env` file in your project root
- Verify the file contains:
  ```
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
  ```

**Solution:**
1. Copy `env.example` to `.env` if it doesn't exist
2. Get your Supabase credentials from:
   - Supabase Dashboard → Project Settings → API
   - Copy the "Project URL" and "anon public" key
3. Restart your development server after updating `.env`

### 2. **Incorrect Supabase URL or Key**

**Check:**
- The URL should be: `https://[project-id].supabase.co` (no trailing slash)
- The key should be the "anon public" key, not the "service_role" key

**Solution:**
- Verify credentials in Supabase Dashboard → Settings → API
- Ensure no extra spaces or quotes in `.env` file

### 3. **Network/Firewall Issues**

**Check:**
- Can you access `https://your-project-id.supabase.co` in your browser?
- Is your firewall blocking outgoing connections?
- Are you behind a corporate proxy?

**Solution:**
- Test Supabase URL in browser
- Check firewall settings
- If behind a proxy, configure proxy settings in your environment

### 4. **Supabase Service Status**

**Check:**
- Visit https://status.supabase.com/
- Check if there are any ongoing incidents

**Solution:**
- Wait for service to be restored
- Check Supabase status page for updates

### 5. **CORS Issues**

**Check:**
- Check browser console for CORS-related errors
- Verify Supabase project settings

**Solution:**
- In Supabase Dashboard → Settings → API
- Add your localhost URL to allowed origins (for development)
- Add your production domain (for production)

### 6. **Development Server Not Restarted**

**Solution:**
- Stop your dev server (Ctrl+C)
- Restart with `npm run dev` or `bun dev`
- Environment variables are only loaded on server start

## Quick Diagnostic Steps

1. **Check environment variables are loaded:**
   ```javascript
   console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) + '...');
   ```

2. **Test Supabase connection directly:**
   - Open browser console
   - Try: `fetch('https://your-project-id.supabase.co/rest/v1/')`
   - If this fails, it's a network issue

3. **Check Supabase project is active:**
   - Visit Supabase Dashboard
   - Ensure project is not paused
   - Free tier projects pause after inactivity

## Still Having Issues?

1. Verify your Supabase project is active and not paused
2. Check browser network tab for specific error details
3. Try incognito/private browsing mode to rule out browser extensions
4. Test with a different network connection
5. Check Supabase project logs in the dashboard

## Error Codes Reference

- `ERR_CONNECTION_TIMED_OUT`: Network cannot reach Supabase
- `Failed to fetch`: Network or CORS issue
- `JWT expired`: Authentication token issue (refresh page)
- `Invalid API key`: Wrong credentials in `.env`

