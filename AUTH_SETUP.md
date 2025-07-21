# Authentication Setup Guide

## Overview

This setup ensures that all API routes (except `/api/auth/me`) require a valid token to access. The token is generated using the `ENC_SECRET` environment variable.

## Files Created/Modified

### 1. `/api/auth/me` endpoint

- **File**: `src/app/api/auth/me/route.ts`
- **Purpose**: Validates tokens generated with `ENC_SECRET`
- **Method**: GET
- **Headers Required**: `Authorization: Bearer <token>`

### 2. Middleware

- **File**: `src/lib/middleware/middleware.ts`
- **Purpose**: Runs on all `/api/*` routes to validate requests
- **Excludes**: `/api/auth/me` (to avoid infinite loops)

### 3. Crypto utilities

- **File**: `src/lib/crypto.ts`
- **Purpose**: Provides `encrypt()` and `decrypt()` functions using `ENC_SECRET`

## Environment Setup

Add to your `.env` file:

```
ENC_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

## Testing the Authentication

### 1. Generate a valid token

```bash
# In your project directory
node -e "
const { encrypt } = require('./src/lib/crypto');
console.log('Valid token:', encrypt(process.env.ENC_SECRET));
"
```

### 2. Test API access

```bash
# Test without token (should fail)
curl http://localhost:3000/api/decks

# Test with valid token (should succeed)
curl -H "Authorization: Bearer <your-generated-token>" http://localhost:3000/api/decks
```

### 3. Test the auth endpoint directly

```bash
# Test valid token
curl -H "Authorization: Bearer <your-generated-token>" http://localhost:3000/api/auth/me

# Test invalid token
curl -H "Authorization: Bearer invalid-token" http://localhost:3000/api/auth/me
```

## Frontend Integration

When making API calls from your frontend, include the token in the Authorization header:

```typescript
// Example of making an authenticated API call
const token = encrypt(process.env.ENC_SECRET!);
const response = await fetch("/api/decks", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Troubleshooting

1. **"ENC_SECRET environment variable is not set"**
   - Ensure `ENC_SECRET` is defined in your `.env` file

2. **"Invalid encrypted text format"**
   - Make sure you're using the correct encryption format

3. **Infinite loops**
   - The middleware automatically skips `/api/auth/me` to prevent this

4. **CORS issues**
   - Ensure your frontend and backend are on the same origin, or configure CORS appropriately
