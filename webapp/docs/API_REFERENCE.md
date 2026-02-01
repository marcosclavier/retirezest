# API Reference - RetireZest

**Version**: 1.0
**Base URL**: https://www.retirezest.com/api
**Last Updated**: January 31, 2026

---

## Table of Contents

1. [Authentication](#authentication)
2. [Simulation API](#simulation-api)
3. [Scenario Management](#scenario-management)
4. [User Profile API](#user-profile-api)
5. [Subscription API](#subscription-api)
6. [Feedback API](#feedback-api)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints (except `/api/auth/login` and `/api/auth/register`) require authentication via JWT token stored in httpOnly cookie.

### POST /api/auth/login

**Purpose**: Authenticate user and create session

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "subscriptionTier": "free"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - Invalid credentials
- `500 Internal Server Error` - Server error

---

### POST /api/auth/register

**Purpose**: Create new user account

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Account created successfully",
  "userId": "uuid"
}
```

**Error Responses**:
- `400 Bad Request` - Missing required fields or invalid email format
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Server error

---

### POST /api/auth/logout

**Purpose**: End user session

**Request**: No body required

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Simulation API

### POST /api/simulation/run

**Purpose**: Execute retirement simulation

**Authentication**: Required

**Request**:
```json
{
  "scenarioId": "uuid",
  "strategy": "balanced"
}
```

**Parameters**:
- `scenarioId` (string, required): ID of scenario to simulate
- `strategy` (string, required): Withdrawal strategy
  - `"balanced"` - Balanced withdrawal
  - `"minimize-income"` - GIS-optimized
  - `"rrif-frontload"` - Tax-optimized RRIF frontload
  - `"constant-percentage"` - Fixed withdrawal rate
  - `"tfsa-first"` - TFSA-first priority

**Response (200 OK)**:
```json
{
  "success": true,
  "simulationId": "uuid",
  "result": {
    "successRate": 85.5,
    "summary": {
      "finalEstateValue": 350000,
      "shortfallYears": 0,
      "totalIncome": 2500000,
      "totalTaxes": 450000,
      "startAge": 65,
      "endAge": 95
    },
    "year_by_year": [
      {
        "year": 2026,
        "age_p1": 65,
        "total_income": 75000,
        "cpp_p1": 14396,
        "oas_p1": 8560,
        "gis_p1": 0,
        "end_rrif_p1": 180000,
        "end_tfsa_p1": 95000,
        "end_nonreg_p1": 50000,
        "tax_p1": 12000,
        "spending_met_after_tax": 60000,
        "underfunded_after_tax": 0
      },
      // ... more years
    ]
  }
}
```

**Error Responses**:
- `400 Bad Request` - Missing or invalid parameters
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - Simulation limit reached (free tier) or premium feature required
- `404 Not Found` - Scenario not found
- `500 Internal Server Error` - Simulation engine error

**Rate Limiting**:
- **Free Tier**: 10 simulations max (lifetime)
- **Premium Tier**: Unlimited

---

### GET /api/simulation/[id]

**Purpose**: Retrieve simulation results

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "simulation": {
    "id": "uuid",
    "userId": "uuid",
    "scenarioId": "uuid",
    "strategy": "balanced",
    "province": "ON",
    "startAge": 65,
    "successRate": 85.5,
    "createdAt": "2026-01-31T12:00:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Simulation not found or doesn't belong to user

---

### GET /api/user/simulation-count

**Purpose**: Get user's simulation count and limit

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "count": 7,
  "limit": 10,
  "remaining": 3
}
```

**Note**: Premium users will show `limit: null` (unlimited)

---

## Scenario Management

### GET /api/scenario

**Purpose**: List user's scenarios

**Authentication**: Required

**Query Parameters**:
- `isBaseline` (boolean, optional): Filter for baseline scenarios only

**Response (200 OK)**:
```json
{
  "success": true,
  "scenarios": [
    {
      "id": "uuid",
      "name": "Baseline",
      "description": "My default retirement scenario",
      "currentAge": 51,
      "retirementAge": 65,
      "province": "QC",
      "rrspBalance": 250000,
      "tfsaBalance": 95000,
      "nonRegBalance": 50000,
      "liraBalance": 0,
      "annualExpenses": 60000,
      "cppStartAge": 65,
      "oasStartAge": 65,
      "isBaseline": true,
      "createdAt": "2026-01-30T10:00:00Z",
      "updatedAt": "2026-01-30T10:00:00Z"
    }
  ]
}
```

---

### POST /api/scenario/create-baseline

**Purpose**: Create baseline scenario from user profile

**Authentication**: Required

**Request**: No body required (uses user's profile data)

**Response (201 Created)**:
```json
{
  "success": true,
  "scenario": {
    "id": "uuid",
    "name": "Baseline",
    "description": "Default retirement scenario",
    "currentAge": 51,
    "retirementAge": 65,
    "province": "QC",
    // ... other fields populated from user profile
    "isBaseline": true
  }
}
```

**Error Responses**:
- `400 Bad Request` - Baseline scenario already exists
- `401 Unauthorized` - User not authenticated

---

### GET /api/scenario/[id]

**Purpose**: Get single scenario

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "scenario": {
    // Same structure as scenario in list response
  }
}
```

**Error Responses**:
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Scenario not found or doesn't belong to user

---

### PUT /api/scenario/[id]

**Purpose**: Update scenario

**Authentication**: Required

**Request**:
```json
{
  "name": "Updated Scenario Name",
  "retirementAge": 67,
  "annualExpenses": 55000
  // ... other fields to update
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "scenario": {
    // Updated scenario object
  }
}
```

**Error Responses**:
- `400 Bad Request` - Invalid field values
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Scenario not found

---

### DELETE /api/scenario/[id]

**Purpose**: Delete scenario

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Scenario deleted successfully"
}
```

**Error Responses**:
- `400 Bad Request` - Cannot delete baseline scenario
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Scenario not found

---

## User Profile API

### GET /api/profile

**Purpose**: Get user profile information

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1974-12-19",
    "province": "QC",
    "targetRetirementAge": 65,
    "subscriptionTier": "free",
    "subscriptionStatus": null
  }
}
```

---

### PUT /api/profile

**Purpose**: Update user profile

**Authentication**: Required

**Request**:
```json
{
  "firstName": "Jane",
  "province": "ON",
  "targetRetirementAge": 67
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "profile": {
    // Updated profile object
  }
}
```

**Error Responses**:
- `400 Bad Request` - Invalid field values
- `401 Unauthorized` - User not authenticated

---

## Subscription API

### POST /api/subscription/create-checkout-session

**Purpose**: Create Stripe checkout session for subscription

**Authentication**: Required

**Request**:
```json
{
  "priceId": "price_xxxxxxxxxxxxx",
  "successUrl": "https://www.retirezest.com/subscribe/success",
  "cancelUrl": "https://www.retirezest.com/subscribe"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "sessionId": "cs_test_xxxxxxxxxxxxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxxxxxxxxxx"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid price ID
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Stripe API error

---

### POST /api/subscription/create-portal-session

**Purpose**: Create Stripe customer portal session (manage subscription)

**Authentication**: Required

**Request**:
```json
{
  "returnUrl": "https://www.retirezest.com/account/billing"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "url": "https://billing.stripe.com/p/session/xxxxxxxxxxxxx"
}
```

**Error Responses**:
- `400 Bad Request` - User has no Stripe customer ID
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Stripe API error

---

### POST /api/webhooks/stripe

**Purpose**: Handle Stripe webhook events

**Authentication**: Stripe signature verification

**Request**: Raw webhook payload from Stripe

**Events Handled**:
- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription status changed
- `customer.subscription.deleted` - Subscription canceled

**Response (200 OK)**:
```json
{
  "received": true
}
```

**Error Responses**:
- `400 Bad Request` - Invalid signature
- `500 Internal Server Error` - Database update error

---

## Feedback API

### POST /api/feedback/submit

**Purpose**: Submit user feedback

**Authentication**: Required

**Request**:
```json
{
  "satisfactionScore": 3,
  "improvementSuggestion": "Add more withdrawal strategies",
  "missingFeatures": ["Real estate planning", "Couples support"],
  "wouldRecommend": true
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "feedbackId": "uuid",
  "message": "Thank you for your feedback!"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid satisfaction score (must be 1-5)
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Database error

---

### GET /api/feedback

**Purpose**: Get user's feedback history

**Authentication**: Required (admin only)

**Response (200 OK)**:
```json
{
  "success": true,
  "feedback": [
    {
      "id": "uuid",
      "userId": "uuid",
      "satisfactionScore": 3,
      "improvementSuggestion": "Add more withdrawal strategies",
      "createdAt": "2026-01-30T15:00:00Z",
      "respondedAt": null
    }
  ]
}
```

---

## Error Handling

### Standard Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User lacks permissions (e.g., free tier limit) |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

### Example Error Responses

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Please log in to access this resource"
}
```

**403 Forbidden (Free Tier Limit)**:
```json
{
  "success": false,
  "error": "Free tier limit reached",
  "message": "You've used all 10 free simulations. Upgrade to Premium for unlimited simulations!",
  "requiresUpgrade": true,
  "simulationCount": 10,
  "simulationLimit": 10,
  "upgradeUrl": "/subscribe"
}
```

**403 Forbidden (Premium Feature)**:
```json
{
  "success": false,
  "error": "Premium feature required",
  "message": "Multiple market scenarios are only available for Premium users.",
  "upgradeUrl": "/subscribe"
}
```

**429 Rate Limit Exceeded**:
```json
{
  "success": false,
  "error": "Daily limit reached",
  "message": "Free users can run 3 early retirement calculations per day. Upgrade to Premium for unlimited access.",
  "upgradeUrl": "/subscribe",
  "resetTime": "2026-02-01T00:00:00Z"
}
```

---

## Rate Limiting

### Simulation API

**Free Tier**:
- **Limit**: 10 simulations (lifetime)
- **Action**: Block with upgrade prompt

**Premium Tier**:
- **Limit**: Unlimited
- **Throttling**: 100 simulations/hour (abuse prevention)

### Early Retirement API

**Free Tier**:
- **Limit**: 3 calculations/day
- **Reset**: Daily at midnight UTC

**Premium Tier**:
- **Limit**: Unlimited
- **Throttling**: 1000 calculations/hour

### General API

**All Endpoints**:
- **Limit**: 1000 requests/hour per user
- **Burst**: 100 requests/minute
- **Response Header**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## API Versioning

**Current Version**: v1
**Base URL**: `/api/` (no version prefix for v1)

Future versions will be prefixed:
- v2: `/api/v2/`
- v3: `/api/v3/`

**Deprecation Policy**:
- Old versions supported for 6 months after new version release
- Deprecation warnings sent via email 3 months before EOL

---

## References

- **Premium Features**: `/Users/jrcb/Documents/GitHub/retirezest/webapp/docs/PREMIUM_FEATURES_IMPLEMENTATION.md`
- **Authentication Guide**: `/Users/jrcb/Documents/GitHub/retirezest/webapp/lib/auth.ts`
- **Database Schema**: `/Users/jrcb/Documents/GitHub/retirezest/webapp/prisma/schema.prisma`

---

**Last Updated**: January 31, 2026
**Maintained By**: Engineering Team
**Next Review**: Quarterly or when major API changes are made
