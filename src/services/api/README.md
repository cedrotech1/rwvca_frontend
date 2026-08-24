# API Services

This directory contains all API service files for the WARS frontend application.

## Structure

- `config.js` - Axios configuration with interceptors
- `authService.js` - Authentication-related API calls
- `userService.js` - User management API calls
- `index.js` - Main export file for all services

## Usage

```javascript
import { authService, userService } from '../services/api';

// Login
const result = await authService.login({ email, password });

// Get all users
const users = await userService.getAllUsers();
```

## Environment Variables

Make sure to configure your `.env` file with:

```
VITE_API_BASE_URL=http://localhost/api/v1
VITE_API_TIMEOUT=10000
VITE_NODE_ENV=development
```
