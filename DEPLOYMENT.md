# Deployment Guide for Netlify

## Frontend Deployment (Netlify)

This application has a separate frontend (React) and backend (Node.js). Netlify can only host the frontend. You'll need to deploy the backend separately (e.g., Heroku, Railway, Render, etc.).

### Netlify Configuration

The following files have been created to help with Netlify deployment:

1. **`netlify.toml`** - Main configuration file
2. **`client/public/_redirects`** - Handles React Router routing

### Netlify Build Settings

In your Netlify dashboard, make sure these settings are configured:

- **Build command**: `cd client && npm install && npm run build`
- **Publish directory**: `client/build`
- **Node version**: 18.x or higher

Or simply use the `netlify.toml` file which has these settings configured.

### Environment Variables

You need to set environment variables in Netlify for the API URL:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: Your backend API URL (e.g., `https://your-backend.herokuapp.com/api` or `https://api.yourdomain.com/api`)

**Important**: The backend API must be deployed separately and accessible via HTTPS.

### Backend Deployment Options

Since Netlify only hosts static files, you need to deploy the backend separately:

#### Option 1: Heroku
1. Create a `Procfile` in the root directory:
   ```
   web: node server/index.js
   ```
2. Deploy using Heroku CLI or GitHub integration

#### Option 2: Railway
1. Connect your GitHub repository
2. Set the root directory to the project root
3. Railway will auto-detect Node.js

#### Option 3: Render
1. Create a new Web Service
2. Point to your GitHub repository
3. Set build command: `npm install`
4. Set start command: `node server/index.js`

### CORS Configuration

Make sure your backend has CORS enabled for your Netlify domain. The backend already has CORS configured, but you may need to restrict it to your Netlify domain in production:

```javascript
// In server/index.js, update CORS if needed:
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
```

### Troubleshooting

#### 404 Errors on Routes
- Make sure `_redirects` file is in `client/public/`
- Verify `netlify.toml` has the redirect rules
- Check that the build completed successfully

#### API Connection Errors
- Verify `REACT_APP_API_URL` environment variable is set in Netlify
- Check that your backend is deployed and accessible
- Ensure CORS is configured correctly on the backend

#### Build Failures
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check Netlify build logs for specific errors

### Quick Deploy Steps

1. **Push code to GitHub** (already done)
2. **Connect Netlify to GitHub**:
   - Go to Netlify dashboard
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository
   - Netlify should auto-detect the `netlify.toml` settings
3. **Set Environment Variables**:
   - Add `REACT_APP_API_URL` with your backend URL
4. **Deploy Backend** (separately on Heroku/Railway/Render)
5. **Test the deployment**

### Post-Deployment Checklist

- [ ] Frontend is accessible on Netlify
- [ ] Backend is deployed and accessible
- [ ] Environment variables are set
- [ ] API connection works (test login)
- [ ] React Router routes work (no 404s)
- [ ] CORS is configured correctly

