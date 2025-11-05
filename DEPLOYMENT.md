# P-Advisor Deployment Guide

## Environment Variables for Vercel

When deploying to Vercel, you need to configure the following environment variables in your Vercel project settings:

### Required Environment Variables

```bash
# Paysera Intranet API Configuration
VITE_PAYSERA_API_KEY=your_api_key_here
VITE_PAYSERA_EMAIL=your_email@paysera.net
VITE_PAYSERA_INTRANET_URL=https://intranet.paysera.net
```

### How to Add Environment Variables in Vercel

1. Log in to your Vercel account
2. Navigate to your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Name**: `VITE_PAYSERA_API_KEY`
   - **Value**: `your_api_key_here`
   - **Environment**: Select all (Production, Preview, Development)
   
5. Repeat for:
   - `VITE_PAYSERA_EMAIL` = `your_email@paysera.net`
   - `VITE_PAYSERA_INTRANET_URL` = `https://intranet.paysera.net`

6. Click **Save** for each variable

### Deployment Steps

1. **Connect Repository to Vercel**
   ```bash
   # If not already connected, push your code to GitHub
   git add .
   git commit -m "Deploy P-Advisor to Vercel"
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to Vercel Dashboard
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Configure build settings (Vite should be auto-detected)

3. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables** (as described above)

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### Post-Deployment

After deployment, your application will be available at:
- Production URL: `https://your-project-name.vercel.app`

### Redeployment

To redeploy with changes:
```bash
git add .
git commit -m "Update description"
git push origin main
```

Vercel will automatically detect the push and redeploy.

### Troubleshooting

**Build Errors:**
- Ensure all environment variables are set correctly
- Check the build logs in Vercel dashboard
- Verify that all dependencies are listed in package.json

**CORS Issues:**
- The Paysera Intranet API must allow requests from your Vercel domain
- Contact your IT team if you encounter CORS errors

**Environment Variables Not Working:**
- Ensure variables start with `VITE_` prefix (required for Vite)
- Redeploy after adding/changing environment variables
- Clear cache and redeploy if needed

### Security Notes

- **API Key Security**: The API key is exposed in the frontend. Ensure it has limited permissions.
- **Intranet Access**: The API key should only have read access to specific Confluence pages.
- **Alternative**: For production, consider implementing a backend proxy to hide credentials.

### Production Checklist

- [ ] All environment variables configured in Vercel
- [ ] Build succeeds without errors
- [ ] Transfer Check feature works correctly
- [ ] Company Validation feature works correctly
- [ ] IBAN & SWIFT Validator works correctly
- [ ] UI displays properly on desktop and mobile
- [ ] No console errors in browser
- [ ] API calls return expected data
