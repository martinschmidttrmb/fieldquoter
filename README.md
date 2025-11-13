# Field Quoter Application

A web-based field quoter application for TMWSuite sales representatives to quickly generate quotes for customers.

## Features

- **Three User Roles:**
  - **Admins**: Full access including impersonation feature
  - **Managers**: Can view and manage their team's quotes
  - **General Users**: Can only see and manage their own quotes

- **Package Management:**
  - TMWSuite Foundations
  - TMWSuite Professional
  - TMWSuite Professional Plus
  - Each package can have multiple modules

- **Quote Features:**
  - Create quotes based on number of trucks
  - Select packages and modules
  - Automatic implementation hours calculation
  - Export quotes to PDF
  - Share quotes with managers for discount approval
  - Manager approval workflow

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install-all
```

2. Create a `.env` file from the example:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration (especially JWT_SECRET for production)

### Running the Application

Start both server and client in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Backend server
npm run server

# Terminal 2 - Frontend client
npm run client
```

### Default Login

- **Email**: admin@tmwsuite.com
- **Password**: admin123

**⚠️ IMPORTANT**: Change the default admin password in production!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin/Manager only)
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/impersonate` - Impersonate user (Admin only)

### Quotes
- `GET /api/quotes` - Get quotes (filtered by role)
- `GET /api/quotes/:id` - Get specific quote
- `POST /api/quotes` - Create new quote
- `PUT /api/quotes/:id` - Update quote
- `POST /api/quotes/:id/share` - Share quote with manager
- `POST /api/quotes/:id/approve` - Approve/reject quote (Manager/Admin)
- `DELETE /api/quotes/:id` - Delete quote

### Packages
- `GET /api/packages` - Get all packages with modules
- `GET /api/packages/:id` - Get specific package
- `POST /api/packages` - Create package (Admin only)
- `POST /api/packages/:id/modules` - Add module to package (Admin only)

### Users
- `GET /api/users` - Get users (filtered by role)
- `GET /api/users/team` - Get team members (Manager/Admin)
- `GET /api/users/:id` - Get specific user

### Calculations
- `POST /api/calculations/implementation-hours` - Calculate implementation hours
- `GET /api/calculations/parameters` - Get calculation parameters (Admin only)
- `PUT /api/calculations/parameters/:id` - Update parameter (Admin only)

## Project Structure

```
field-quoter/
├── server/                 # Backend server
│   ├── database/          # Database initialization
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API routes
│   └── index.js           # Server entry point
├── client/                # Frontend React app (to be created)
└── package.json           # Root package.json
```

## Database Schema

- **users**: User accounts with roles
- **packages**: TMWSuite packages
- **modules**: Modules that can be added to packages
- **quotes**: Customer quotes
- **quote_modules**: Many-to-many relationship between quotes and modules
- **calculation_parameters**: Backend parameters for hour calculations

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Role-based access control (RBAC) is enforced
- SQL injection protection via parameterized queries
- CORS enabled for frontend communication

## Next Steps

The frontend React application needs to be created. The backend API is ready and can be tested using tools like Postman or curl.

