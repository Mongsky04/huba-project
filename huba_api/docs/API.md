# Huba API Documentation

## Overview

Huba API provides e-commerce functionality for the KGiTON ecosystem, including product catalog, shopping cart, and transaction management.

## Table of Contents

1. [Authentication](#authentication)
2. [User Profiles](#user-profiles)
3. [Items](#items)
4. [Shopping Cart](#shopping-cart)
5. [Transactions](#transactions)
6. [Error Handling](#error-handling)

## Authentication

All protected endpoints require a JWT token obtained from the KGiTON Core API.

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## User Profiles

### Get User Profile

**Endpoint:** `GET /api/profile`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "phone_number": "+62812345678",
    "address": "Jl. Example No. 123",
    "city": "Jakarta",
    "state": "DKI Jakarta",
    "postal_code": "12345",
    "country": "Indonesia",
    "date_of_birth": "1990-01-01",
    "profile_image_url": "https://example.com/image.jpg",
    "bio": "User bio",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

### Create/Update Profile

**Endpoint:** `PUT /api/profile`

**Authentication:** Required

**Request Body:**
```json
{
  "phone_number": "+62812345678",
  "address": "Jl. Example No. 123",
  "city": "Jakarta",
  "state": "DKI Jakarta",
  "postal_code": "12345",
  "country": "Indonesia",
  "date_of_birth": "1990-01-01",
  "profile_image_url": "https://example.com/image.jpg",
  "bio": "User bio"
}
```

## Items

### Get Items

**Endpoint:** `GET /api/items`

**Authentication:** Not required

**Query Parameters:**
- `category` (optional) - Filter by category
- `search` (optional) - Search by name
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page

**Response:**
```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Apple Fuji",
      "description": "Fresh Fuji apples",
      "price": 15000,
      "image_url": "https://example.com/apple.jpg",
      "category": "Fruits",
      "stock_quantity": 100,
      "unit": "kg",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Get Item by ID

**Endpoint:** `GET /api/items/:id`

**Authentication:** Not required

### Get Categories

**Endpoint:** `GET /api/items/categories`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": ["Fruits", "Vegetables", "Grains"]
}
```

## Shopping Cart

### Get Cart

**Endpoint:** `GET /api/cart`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "item_id": "uuid",
      "quantity": 2,
      "added_at": "2025-01-01T00:00:00Z",
      "item": {
        "id": "uuid",
        "name": "Apple Fuji",
        "price": 15000,
        "image_url": "https://example.com/apple.jpg"
      }
    }
  ]
}
```

### Add to Cart

**Endpoint:** `POST /api/cart`

**Authentication:** Required

**Request Body:**
```json
{
  "item_id": "uuid",
  "quantity": 2
}
```

### Update Cart Item

**Endpoint:** `PUT /api/cart/:id`

**Authentication:** Required

**Request Body:**
```json
{
  "quantity": 3
}
```

### Remove from Cart

**Endpoint:** `DELETE /api/cart/:id`

**Authentication:** Required

### Clear Cart

**Endpoint:** `DELETE /api/cart`

**Authentication:** Required

## Transactions

### Create Transaction

**Endpoint:** `POST /api/transactions`

**Authentication:** Required

**Description:** Creates a transaction from the current cart items

**Request Body:**
```json
{
  "payment_method": "credit_card",
  "shipping_address": "Jl. Example No. 123",
  "shipping_city": "Jakarta",
  "shipping_state": "DKI Jakarta",
  "shipping_postal_code": "12345",
  "shipping_phone": "+62812345678",
  "notes": "Please deliver in the morning"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "id": "uuid",
    "transaction_code": "TRX-20251224-000001",
    "user_id": "uuid",
    "total_amount": 30000,
    "status": "pending",
    "payment_method": "credit_card",
    "shipping_address": "Jl. Example No. 123",
    "created_at": "2025-12-24T00:00:00Z"
  }
}
```

### Get Transactions

**Endpoint:** `GET /api/transactions`

**Authentication:** Required

**Query Parameters:**
- `status` (optional) - Filter by status
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response:**
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "transaction_code": "TRX-20251224-000001",
      "user_id": "uuid",
      "total_amount": 30000,
      "status": "completed",
      "payment_method": "credit_card",
      "created_at": "2025-12-24T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

### Get Transaction by ID

**Endpoint:** `GET /api/transactions/:id`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Transaction retrieved successfully",
  "data": {
    "id": "uuid",
    "transaction_code": "TRX-20251224-000001",
    "user_id": "uuid",
    "total_amount": 30000,
    "status": "completed",
    "payment_method": "credit_card",
    "shipping_address": "Jl. Example No. 123",
    "created_at": "2025-12-24T00:00:00Z",
    "items": [
      {
        "id": "uuid",
        "transaction_id": "uuid",
        "item_id": "uuid",
        "item_name": "Apple Fuji",
        "item_price": 15000,
        "quantity": 2,
        "subtotal": 30000,
        "created_at": "2025-12-24T00:00:00Z"
      }
    ]
  }
}
```

### Update Transaction Status

**Endpoint:** `PUT /api/transactions/:id/status`

**Authentication:** Required

**Request Body:**
```json
{
  "status": "completed"
}
```

**Available Statuses:**
- `pending`
- `processing`
- `completed`
- `cancelled`
- `failed`

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

### Common HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding rate limiting in production.

## Webhooks

Huba API receives webhooks from KGiTON Core API for cross-service events.

### Webhook Endpoint

**Endpoint:** `POST /api/webhooks/kgiton`

**Headers:**
```
Content-Type: application/json
x-kgiton-signature: <hmac_sha256_signature>
x-kgiton-timestamp: <iso_timestamp>
x-kgiton-event-id: <uuid>
```

### Signature Verification

Webhooks are signed using HMAC-SHA256:
1. Signature payload: `{timestamp}.{json_body}`
2. Algorithm: HMAC-SHA256 with shared secret
3. Timestamp tolerance: 5 minutes (prevents replay attacks)

### Supported Events

| Event | Description |
|-------|-------------|
| `user.verified` | User email verified, creates extended profile |
| `user.deleted` | User deleted, cleans up user data |
| `license.assigned` | License key assigned to user |

### Example Payload

```json
{
  "event": "user.verified",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-12-24T10:00:00Z",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "extended_profile": {
      "phone_number": "+62812345678",
      "address": "Jl. Example No. 123",
      "city": "Jakarta"
    }
  }
}
```

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page` - Page number (starts at 1)
- `limit` - Items per page

**Response includes pagination object:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
