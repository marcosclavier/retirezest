# Error Codes and Handling Guide

This document describes all error codes used in the RetireZest application, their meanings, and how to handle them on the client side.

## Error Response Format

All API errors follow this consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "field": "fieldName (optional, for validation errors)",
  "stack": "Stack trace (development only)"
}
```

## HTTP Status Codes

| Status Code | Meaning | When Used |
|------------|---------|-----------|
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Python API unavailable |

## Error Codes

### Authentication & Authorization Errors

#### `AUTHENTICATION_ERROR` (401)
**Description**: User is not authenticated or session is invalid

**Common Causes**:
- No session cookie
- Expired session
- Invalid token

**Client-Side Handling**:
```typescript
if (response.status === 401) {
  // Redirect to login page
  router.push('/login');
}
```

#### `AUTHORIZATION_ERROR` (403)
**Description**: User is authenticated but lacks permission

**Common Causes**:
- Attempting to access another user's resources
- Insufficient role/permissions

**Client-Side Handling**:
```typescript
if (response.status === 403) {
  toast.error('You do not have permission to perform this action');
}
```

### Validation Errors

#### `VALIDATION_ERROR` (400)
**Description**: Input validation failed

**Common Causes**:
- Missing required fields
- Invalid data format
- Out-of-range values

**Response Example**:
```json
{
  "error": "Email is required",
  "code": "VALIDATION_ERROR",
  "field": "email"
}
```

**Client-Side Handling**:
```typescript
if (error.code === 'VALIDATION_ERROR' && error.field) {
  // Highlight the specific field
  setFieldError(error.field, error.error);
} else {
  // Show general error message
  toast.error(error.error);
}
```

### Resource Errors

#### `NOT_FOUND` (404)
**Description**: Requested resource doesn't exist

**Common Causes**:
- Invalid ID in URL
- Resource was deleted
- Typo in endpoint

**Client-Side Handling**:
```typescript
if (response.status === 404) {
  toast.error('Resource not found');
  router.push('/dashboard'); // Redirect to safe location
}
```

### Rate Limiting

#### `RATE_LIMIT_EXCEEDED` (429)
**Description**: Too many requests from this client

**Response Example**:
```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "resetAt": "2025-12-05T10:30:00Z"
}
```

**Response Headers**:
- `Retry-After`: Seconds until limit resets
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Reset time (ISO 8601)

**Client-Side Handling**:
```typescript
if (response.status === 429) {
  const resetAt = new Date(error.resetAt);
  const minutes = Math.ceil((resetAt.getTime() - Date.now()) / 60000);
  toast.error(`Too many attempts. Please try again in ${minutes} minutes.`);
}
```

### Database Errors

#### `DATABASE_ERROR` (500)
**Description**: Database operation failed

**Common Causes**:
- Database connection lost
- Constraint violation
- Deadlock

**Client-Side Handling**:
```typescript
if (error.code === 'DATABASE_ERROR') {
  toast.error('A database error occurred. Please try again.');
}
```

### Internal Errors

#### `INTERNAL_ERROR` (500)
**Description**: Unexpected server error

**Note**: In production, details are hidden. In development, full stack trace is provided.

**Client-Side Handling**:
```typescript
if (response.status === 500) {
  toast.error('An unexpected error occurred. Please try again later.');
  // Optionally report to error tracking service
}
```

## Client-Side Error Handling Patterns

### Basic Fetch with Error Handling

```typescript
async function makeApiCall(endpoint: string, options: RequestInit) {
  try {
    const response = await fetch(endpoint, options);

    if (!response.ok) {
      const error = await response.json();

      // Handle specific error codes
      switch (error.code) {
        case 'AUTHENTICATION_ERROR':
          router.push('/login');
          break;
        case 'VALIDATION_ERROR':
          handleValidationError(error);
          break;
        case 'RATE_LIMIT_EXCEEDED':
          handleRateLimit(error);
          break;
        default:
          toast.error(error.error || 'An error occurred');
      }

      throw error;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      toast.error('Network error. Please check your connection.');
    }
    throw error;
  }
}
```

### React Hook for Error Handling

```typescript
function useApiError() {
  const router = useRouter();
  const toast = useToast();

  const handleError = useCallback((error: ApiError) => {
    switch (error.code) {
      case 'AUTHENTICATION_ERROR':
        toast.error('Please log in to continue');
        router.push('/login');
        break;

      case 'VALIDATION_ERROR':
        if (error.field) {
          toast.error(`${error.field}: ${error.error}`);
        } else {
          toast.error(error.error);
        }
        break;

      case 'RATE_LIMIT_EXCEEDED':
        const resetAt = new Date(error.resetAt);
        const minutes = Math.ceil((resetAt.getTime() - Date.now()) / 60000);
        toast.error(`Too many requests. Try again in ${minutes} minutes.`);
        break;

      default:
        toast.error(error.error || 'An error occurred');
    }
  }, [router, toast]);

  return { handleError };
}
```

### Form Validation Errors

```typescript
function handleFormErrors(error: ApiError, setError: UseFormSetError) {
  if (error.code === 'VALIDATION_ERROR' && error.field) {
    setError(error.field, {
      type: 'server',
      message: error.error
    });
  } else {
    // Show general error
    toast.error(error.error);
  }
}
```

## Testing Error Handling

### Development Mode

In development, errors include full stack traces:

```json
{
  "error": "Email is required",
  "code": "VALIDATION_ERROR",
  "field": "email",
  "stack": "Error: Email is required\n    at validateInput..."
}
```

### Production Mode

In production, sensitive details are hidden:

```json
{
  "error": "Email is required",
  "code": "VALIDATION_ERROR",
  "field": "email"
}
```

## Error Logging

All errors are automatically logged with context:

```typescript
logger.error('API request failed', error, {
  endpoint: '/api/users',
  method: 'POST',
  userId: session.userId
});
```

**Development**: Logs to console with full details
**Production**: Logs are sanitized and sent to monitoring service (Sentry - Phase 4)

## Common Error Scenarios

### 1. Expired Session
```typescript
// User's session expired
Response: 401 AUTHENTICATION_ERROR
Action: Redirect to login, show "Session expired" message
```

### 2. Invalid Input
```typescript
// Missing required field
Response: 400 VALIDATION_ERROR, field: "email"
Action: Highlight email field, show error message
```

### 3. Resource Access Denied
```typescript
// Trying to edit another user's data
Response: 403 AUTHORIZATION_ERROR
Action: Show "Access denied" message, redirect to safe page
```

### 4. Resource Not Found
```typescript
// Invalid ID or deleted resource
Response: 404 NOT_FOUND
Action: Show "Not found" message, redirect to list view
```

### 5. Rate Limit Hit
```typescript
// Too many login attempts
Response: 429 RATE_LIMIT_EXCEEDED
Action: Show countdown timer, disable submit button
```

## Best Practices

1. **Always check HTTP status code first**
   ```typescript
   if (!response.ok) {
     const error = await response.json();
     handleError(error);
   }
   ```

2. **Provide user-friendly messages**
   - Don't show technical errors to users
   - Translate error codes to helpful messages
   - Suggest next steps when possible

3. **Handle field-specific validation errors**
   - Highlight the problematic field
   - Show inline error messages
   - Prevent form submission until fixed

4. **Implement retry logic for transient errors**
   ```typescript
   if (response.status === 503) {
     // Retry after a delay
     await sleep(2000);
     return retryRequest();
   }
   ```

5. **Log errors for debugging**
   - Always log errors with context
   - Include user ID, endpoint, and parameters
   - Respect privacy in production logs

## Future Enhancements (Phase 4)

- Integration with Sentry for error tracking
- Error analytics and reporting
- Automatic error recovery strategies
- User feedback collection on errors
- Error rate monitoring and alerts

## Related Documentation

- See `lib/errors.ts` for error class implementations
- See `lib/logger.ts` for logging utilities
- See `app/error.tsx` for client-side error boundary
- See `PRODUCTION-READINESS-PLAN.md` for Phase 4 monitoring plans
