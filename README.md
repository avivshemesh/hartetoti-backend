# Hartetoti Backend API
A robust Express.js backend service with MongoDB integration, authentication routes, and testing capabilities.

## Prerequisites
- Node.js - v22.14.0
- npm - v10.9.2
- MongoDB (local instance or MongoDB Atlas account)

## Environment Setup
Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

## Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/avivshemesh/hartetoti-backend
cd hartetoti-backend
npm install
```

## Available Scripts
- **Start the server**:
  ```bash
  npm start
  ```

- **Run in development mode** (with nodemon for hot reloading):
  ```bash
  npm run dev
  ```

- **Run tests**:
  ```bash
  npm test
  ```

## API Endpoints

### Base URL
- Development: `http://localhost:5000`

### Authentication Routes
All authentication routes are prefixed with `/api/auth`

### Other Routes
More specific endpoint documentation coming soon

## Project Structure
```
/
├── config/                 # Configuration files
│   └── dbHandler.js        # MongoDB connection handler
├── controllers/            # Route controllers
│   └── authController.js   # Authentication controller
├── middleware/             # Custom middleware
│   └── authMiddleware.js   # Authentication middleware
├── models/                 # Database models
│   └── User.js             # User schema model
├── routes/                 # API route definitions
│   └── authRoutes.js       # Authentication routes
├── services/               # Services
│   └── authService.js      # Authentication service
├── tests/                  # Test files
├── utils/                  # Utils functions used all over
├── .env                    # Environment variables (needs to be created)
├── .gitignore              # Git ignore file
├── package.json            # Project dependencies and scripts
├── server.js               # Main application entry point
└── README.md               # Project documentation
```

## Testing
The project uses Jest for testing. Run the test suite with:
```bash
npm test
```

## Deployment
Instructions for deploying to production environments will be added in the future.
