# TruckMate Carrier Portal

A modern web application for trucking carriers to log in and create rate quotes through the TruckMate SaaS platform using TMS Connector.

## Features

- **Secure Login**: Authenticate with TruckMate credentials via TMS Connector
- **Rate Quote Creation**: Generate rate quotes with detailed pickup and delivery information
- **Modern UI**: Clean, responsive design that works on all devices
- **Real-time API Integration**: Direct integration with TruckMate REST API

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API Integration**: TruckMate REST API via TMS Connector
- **Hosting**: Netlify (static site hosting)
- **Authentication**: JWT tokens via TruckMate API

## Setup Instructions

### Prerequisites

- A GitHub account
- A Netlify account (free tier works)
- TruckMate SaaS credentials
- TMS Connector API access

### Deployment to Netlify

1. **Create a GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: TruckMate Carrier Portal"
   git branch -M main
   git remote add origin https://github.com/yourusername/truckmate-carrier.git
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify](https://www.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub account
   - Select your repository
   - Configure build settings:
     - Build command: (leave empty - static site)
     - Publish directory: `truckmate-carrier` (or root if deploying from subdirectory)

3. **Deploy**
   - Netlify will automatically deploy your site
   - Your site will be available at `https://your-site-name.netlify.app`

## API Configuration

The application uses the following API endpoints:

- **TMS Connector Base URL**: `https://tse-tmsconnector.tmwcloud.com`
- **TruckMate API Base URL**: `https://truckmatecloudhub.trimble-transportation.com/tm`
- **API Key**: Configured in `app.js` (currently set to: `a4817aa3d71fe5760a8cf62204e5f25e`)

### Important Security Note

⚠️ **For production use**, you should:
- Move the API key to environment variables
- Use Netlify's environment variables feature
- Never commit sensitive keys to version control

To use environment variables:
1. In Netlify dashboard, go to Site settings → Environment variables
2. Add `TRUCKMATE_API_KEY` with your API key
3. Update `app.js` to read from environment (requires a build step) or use a serverless function

## Usage

### Login

1. Navigate to the website
2. Enter your TruckMate username and password
3. Click "Login"

### Creating a Rate Quote

1. After logging in, fill out the rate quote form:
   - **Pickup Information**: Name, address, city, state, ZIP, date, and time
   - **Delivery Information**: Name, address, city, state, ZIP, date, and time
   - **Shipment Details**: Weight, number of pieces, commodity, service level, customer reference

2. Click "Generate Rate Quote"
3. Review the quote results displayed on the page

## File Structure

```
truckmate-carrier/
├── index.html          # Main HTML structure
├── styles.css          # Styling and responsive design
├── app.js             # Application logic and API integration
├── netlify.toml       # Netlify configuration
└── README.md          # This file
```

## API Endpoints Used

Based on the TruckMate OpenAPI specification:

- `POST /login` - User authentication
- `POST /orders?type=q` - Create rate quote

## Troubleshooting

### Login Issues

- Verify your TruckMate credentials are correct
- Check that the API key is valid
- Ensure TMS Connector is accessible from your network

### Rate Quote Errors

- Verify all required fields are filled
- Check that pickup and delivery addresses are valid
- Ensure service level codes match your TruckMate configuration

### CORS Issues

If you encounter CORS errors:
- The API should allow requests from your Netlify domain
- Contact TruckMate support to whitelist your domain
- Consider using Netlify Functions as a proxy

## Support

For issues related to:
- **TruckMate API**: Contact Trimble Transportation support
- **TMS Connector**: Visit https://tse-tmsconnector.tmwcloud.com
- **Application Issues**: Check the browser console for error messages

## License

© 2025 TruckMate Carrier Portal. Powered by Trimble Transportation.

## References

- [TruckMate OpenAPI Documentation](https://truckmatecloudhub.trimble-transportation.com/tm/openapi.json)
- [TMS Connector](https://tse-tmsconnector.tmwcloud.com)
- [Netlify Documentation](https://docs.netlify.com/)

