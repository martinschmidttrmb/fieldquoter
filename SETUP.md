# Field Quoter - Setup Guide

This guide will help you set up and run the Field Quoter application.

## Prerequisites

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

## Installation Steps

### 1. Install Dependencies

First, install the root dependencies and then the client dependencies:

```bash
# Install root dependencies (backend)
npm install

# Install client dependencies (frontend)
cd client
npm install
cd ..
```

Or use the convenience script:
```bash
npm run install-all
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file and update the following (especially for production):
- `JWT_SECRET`: Change this to a secure random string
- `PORT`: Backend server port (default: 5000)

### 3. Start the Application

#### Development Mode (Recommended)

Start both server and client simultaneously:
```bash
npm run dev
```

This will:
- Start the backend server on `http://localhost:5000`
- Start the React frontend on `http://localhost:3000`

#### Separate Terminals

Or run them separately:

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

### 4. Access the Application

1. Open your browser and go to: `http://localhost:3000`
2. You'll see the login page
3. Use the default admin credentials:
   - **Email**: `admin@tmwsuite.com`
   - **Password**: `admin123`

⚠️ **IMPORTANT**: Change the default admin password in production!

## Default Data

The application comes with:

### Packages
- **TMWSuite Foundations** - Basic package
- **TMWSuite Professional** - Professional package
- **TMWSuite Professional Plus** - Complete package

### Sample Modules
Each package has sample modules pre-loaded:
- Foundations: Basic Dispatch, Fleet Management, Driver Management
- Professional: Advanced Dispatch, Route Optimization, Mobile App, ELD Integration, Fuel Management
- Professional Plus: Predictive Analytics, Custom Reporting, API Integration, Priority Support, Training & Onboarding

### Calculation Parameters
Default implementation hour calculations:
- Base hours per truck: 8
- Package multipliers: Foundations (1.0x), Professional (1.5x), Professional Plus (2.0x)
- Module hours per truck: 2

## User Roles

### Admin
- Full access to all features
- Can view all quotes
- Can impersonate any user
- Can manage users
- Can approve/reject quotes

### Manager
- Can view quotes from their team members
- Can approve/reject quotes shared with them
- Can create and manage team members
- Cannot impersonate users

### General User
- Can create quotes
- Can only see their own quotes
- Can share quotes with managers for approval
- Can export quotes to PDF

## Creating Additional Users

### As Admin:
1. Log in as admin
2. Go to "Users" in the navigation
3. Use the API endpoint `/api/auth/register` (or add a UI for this)

### As Manager:
Managers can create team members through the API endpoint `/api/auth/register`

## API Testing

You can test the API endpoints using tools like:
- **Postman**
- **curl**
- **Thunder Client** (VS Code extension)

Example API call:
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tmwsuite.com","password":"admin123"}'
```

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use:
- Change `PORT` in `.env` for backend
- Change port in `client/package.json` scripts for frontend

### Database Issues
- The database file is created automatically at `server/database/quoter.db`
- If you need to reset, delete the `.db` file and restart the server

### Module Not Found Errors
- Make sure you've run `npm install` in both root and client directories
- Try deleting `node_modules` and reinstalling

### CORS Errors
- Make sure the backend is running on port 5000
- Check that the frontend proxy is configured correctly in `client/package.json`

## Next Steps

1. **Add Modules**: Use the admin interface or API to add more modules to packages
2. **Create Users**: Set up manager and general user accounts
3. **Customize Pricing**: Update package and module prices in the database
4. **Adjust Calculations**: Modify calculation parameters for implementation hours
5. **Styling**: Customize the UI to match your brand

## Production Deployment

Before deploying to production:

1. **Change JWT_SECRET** to a secure random string
2. **Change default admin password**
3. **Use a production database** (PostgreSQL, MySQL, etc.) instead of SQLite
4. **Set up HTTPS**
5. **Configure environment variables** properly
6. **Build the React app**: `cd client && npm run build`
7. **Set up a reverse proxy** (nginx, Apache) to serve the built React app

## Support

For issues or questions, check the README.md file or review the code comments throughout the application.

