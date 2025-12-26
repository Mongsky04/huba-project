# Integration Guide: KGiTON Core API + Huba API

## Architecture

```
┌─────────────────────┐
│   Flutter App       │
└──────────┬──────────┘
           │ flutter_kgiton_sdk
      ┌────┴────┐
      ▼         ▼
┌──────────┐ ┌──────────┐
│Core API  │ │Huba API  │
│Port 3000 │ │Port 3001 │
└────┬─────┘ └────┬─────┘
     │   Webhook  │
     ├───────────►│
     ▼            ▼
┌──────────┐ ┌──────────┐
│Supabase  │ │Supabase  │
│(Core)    │ │(Huba)    │
└──────────┘ └──────────┘
```

## API Responsibilities

| API | Responsibilities |
|-----|------------------|
| **Core API** | Auth, License Keys, Tokens, Top-up, Webhooks |
| **Huba API** | Profiles, Items, Cart, Transactions |

## Webhook Integration

Core API emits HMAC-signed webhooks to Huba API:

### Event: `user.verified`

Triggered when user verifies email. Creates extended profile in Huba.

```json
{
  "event": "user.verified",
  "event_id": "uuid",
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

### Security

| Feature | Description |
|---------|-------------|
| HMAC-SHA256 | Signature verification |
| Timestamp | 5 min tolerance |
| Event ID | Idempotency |
| Retry | 5 attempts with backoff |

## Registration Flow

```
1. User submits registration form with extended profile
   ↓
2. Core API stores in pending_registrations (with extended_profile JSON)
   ↓
3. User receives verification email
   ↓
4. User clicks verification link
   ↓
5. Core API creates auth user
   ↓
6. Core API emits user.verified webhook
   ↓
7. Huba API receives webhook, creates extended_user_profiles
   ↓
8. Profile synced immediately! ✓
```

## Authentication

Both APIs use **Supabase Auth** - no shared JWT secret needed.

```
1. Login via Core API → Get Supabase token
2. Use same token for both APIs
3. Both verify via supabase.auth.getUser(token)
```

## Environment Configuration

### Core API
```env
HUBA_WEBHOOK_URL=http://localhost:3001/api/webhooks/kgiton
HUBA_WEBHOOK_SECRET=shared_secret
HUBA_WEBHOOK_ENABLED=true
```

### Huba API
```env
KGITON_WEBHOOK_SECRET=shared_secret
```

## Flutter SDK Usage

```dart
final sdk = KgitonSDK(
  coreApiUrl: 'http://localhost:3000',
  hubaApiUrl: 'http://localhost:3001',
);

// Register with extended profile
await sdk.register(
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  phoneNumber: '+62812345678',
  address: 'Jl. Example',
  city: 'Jakarta',
);

// After verification, profile is in Huba automatically

// Login
final result = await sdk.login(email, password);
sdk.setToken(result.accessToken);

// Use Huba features
final items = await sdk.huba.getItems(licenseKey: 'ABC123');
await sdk.huba.addToCart(licenseKey: 'ABC123', itemId: 'xxx', qty: 2);
```

## Testing Webhooks

```bash
# 1. Register with extended profile
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "license_key": "YOUR_KEY",
    "phone_number": "+62812345678",
    "city": "Jakarta"
  }'

# 2. Click email verification link

# 3. Check Huba API logs for webhook receipt

# 4. Verify profile in Huba database
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not received | Check WEBHOOK_SECRET matches |
| Profile not created | Check Huba API logs |
| Signature invalid | Verify timestamp is current |
| Auth token invalid | Use same Supabase project tokens |
