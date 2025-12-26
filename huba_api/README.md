# Huba API

Huba API is the secondary backend service for the KGiTON ecosystem, handling items, cart, transactions, and extended user profile management.

## Features

- **Extended User Profiles**: Additional user information (phone, address, bio, etc.)
- **Item Management**: Product catalog with categories and stock management
- **Shopping Cart**: Add, update, and manage cart items
- **Transactions**: Complete purchase flow with order history
- **JWT Authentication**: Secure API endpoints
- **Supabase Integration**: Leveraging Supabase for database and RLS

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT
- **Validation**: Joi

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

## Installation

1. Clone the repository:
```bash
cd huba_api
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://zaevbnzkfiknrhevvfzh.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key

KGITON_API_URL=http://localhost:3000
```

**Important:** Authentication is handled entirely by KGiTON Core API. Huba API verifies tokens issued by Supabase Auth (same as Core API).

4. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `database/schema.sql`

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /health` - Check API status

### User Profile
- `GET /api/profile` - Get user profile (Protected)
- `PUT /api/profile` - Create/update user profile (Protected)

### Items
- `GET /api/items` - Get all items (with pagination and filters)
- `GET /api/items/categories` - Get item categories
- `GET /api/items/:id` - Get item by ID

### Cart
- `GET /api/cart` - Get user cart (Protected)
- `POST /api/cart` - Add item to cart (Protected)
- `PUT /api/cart/:id` - Update cart item (Protected)
- `DELETE /api/cart/:id` - Remove item from cart (Protected)
- `DELETE /api/cart` - Clear cart (Protected)

### Transactions
- `POST /api/transactions` - Create transaction from cart (Protected)
- `GET /api/transactions` - Get user transactions (Protected)
- `GET /api/transactions/:id` - Get transaction details (Protected)
- `PUT /api/transactions/:id/status` - Update transaction status (Protected)

## Authentication

Protected endpoints require a Supabase Auth token in the Authorization header:

```
Authorization: Bearer <supabase_auth_token>
```

**The authentication token is obtained from the KGiTON Core API** during login/registration. Huba API verifies the token using Supabase Auth (same verification method as Core API).

**Flow:**
1. User registers/logs in via **KGiTON Core API**
2. Core API returns Supabase Auth token
3. Client uses the same token for both Core API and Huba API requests
4. Huba API verifies token with Supabase Auth

## Database Schema

### Tables

1. **extended_user_profiles** - Extended user information
2. **items** - Product catalog
3. **cart** - Shopping cart items
4. **transactions** - Purchase orders
5. **transaction_items** - Order line items

For detailed schema, see `database/schema.sql`

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm run start

# Lint code
npm run lint

# Format code
npm run format
```

## Integration with KGiTON Apps

The Huba API works alongside the KGiTON Core API:

- **KGiTON Core API** (`kgiton_api`): Handles authentication, license management, and token operations
- **Huba API** (`huba_api`): Handles e-commerce features (items, cart, transactions)

The `flutter_kgiton_sdk` integrates both APIs to provide a unified experience for mobile applications.

## Project Structure

```
huba_api/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middlewares/      # Express middlewares
│   ├── routes/           # API routes
│   ├── types/            # TypeScript types
│   ├── validators/       # Request validation schemas
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── database/            # Database schemas and scripts
├── docs/               # Documentation
├── .env                # Environment variables
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript config
```

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

All responses follow this format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": { ... },
  "error": "Error details (if any)"
}**Supabase Auth token verification** (same as Core API)
```

## Security

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication
- Helmet.js for security headers
- CORS configuration
- Input validation with Joi

## License

MIT

## Support

For issues and questions, please contact the KGiTON development team.
