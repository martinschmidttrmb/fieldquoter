# Deployment Guide - TruckMate Carrier Portal

## ✅ Step 1: Code Pushed to GitHub

Your code has been successfully pushed to GitHub at:
**Repository**: `https://github.com/martinschmidttrmb/fieldquoter.git`

## 🚀 Step 2: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify**
   - Visit [https://app.netlify.com](https://app.netlify.com)
   - Sign in or create a free account

2. **Import Your Site**
   - Click **"Add new site"** → **"Import an existing project"**
   - Click **"Deploy with GitHub"**
   - Authorize Netlify to access your GitHub account
   - Select your repository: `martinschmidttrmb/fieldquoter`

3. **Configure Build Settings**
   Since your files are in the `truckmate-carrier` subdirectory:
   
   - **Base directory**: `truckmate-carrier`
   - **Build command**: (leave empty - this is a static site)
   - **Publish directory**: `truckmate-carrier` (or `.` if base directory is set)
   
   **Important**: Make sure the publish directory points to where your `index.html` file is located.

4. **Deploy**
   - Click **"Deploy site"**
   - Netlify will automatically deploy your site
   - Your site will be live at: `https://your-site-name.netlify.app`

### Option B: Deploy via Netlify CLI

If you prefer using the command line:

```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Navigate to your project directory
cd truckmate-carrier

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

## 🔧 Step 3: Verify Deployment

After deployment:

1. Visit your Netlify site URL
2. Test the login functionality
3. Test creating a rate quote
4. Check the browser console (F12) for any errors

## 📝 Step 4: Custom Domain (Optional)

1. In Netlify dashboard, go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow the instructions to configure your domain

## 🔒 Step 5: Environment Variables (Recommended for Production)

For better security, move the API key to environment variables:

1. In Netlify dashboard, go to **Site settings** → **Environment variables**
2. Add a new variable:
   - **Key**: `TRUCKMATE_API_KEY`
   - **Value**: `a4817aa3d71fe5760a8cf62204e5f25e`
3. Update `app.js` to use: `const API_KEY = process.env.TRUCKMATE_API_KEY || 'a4817aa3d71fe5760a8cf62204e5f25e';`

**Note**: For static sites, you'll need to use Netlify Functions or build-time environment variables. The current setup works for development/testing.

## 🐛 Troubleshooting

### Site Not Loading
- Check that the publish directory is set correctly
- Verify `index.html` is in the root of the publish directory
- Check Netlify build logs for errors

### API Errors
- Verify the API key is correct
- Check browser console for CORS errors
- Ensure TMS Connector is accessible from Netlify's servers

### Build Errors
- This is a static site, so there shouldn't be build errors
- If you see errors, check the Netlify build logs

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Deployment Guide](https://docs.netlify.com/get-started/)
- [TruckMate API Documentation](https://truckmatecloudhub.trimble-transportation.com/tm/openapi.json)

## ✨ Next Steps

Once deployed:
1. Share the site URL with your team
2. Test all functionality
3. Monitor Netlify analytics for usage
4. Set up custom domain if needed

---

**Your site is ready to deploy!** 🎉

