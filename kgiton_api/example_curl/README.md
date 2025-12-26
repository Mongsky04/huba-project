# 🧪 Test Scripts

Folder ini berisi bash scripts untuk testing API endpoints.

## 📜 Available Scripts

### `token_usage_test.sh` - Token Usage Testing
Test complete flow untuk penggunaan token dari license key.

**What it tests:**
1. ✅ Login dan mendapat JWT token
2. ✅ Get token balance dan license keys
3. ✅ Use token (basic request)
4. ✅ Use token dengan purpose dan metadata
5. ✅ Verify updated balance

**How to run:**
```bash
# Edit credentials di script terlebih dahulu
nano token_usage_test.sh

# Jalankan script
./token_usage_test.sh
```

**Requirements:**
- Server harus running (`npm run dev` atau `npm start`)
- User account dengan license key
- Token balance minimal 2 token

📖 **Documentation**: [docs/TOKEN_USAGE.md](../docs/TOKEN_USAGE.md)

---

### `topup_complete_flow.sh` - Top-up Testing
Test complete flow untuk top-up token balance.

**What it tests:**
1. ✅ Login dan mendapat JWT token
2. ✅ Get current token balance
3. ✅ Request top-up (create PENDING transaction)
4. ✅ Simulate payment webhook (update to SUCCESS)
5. ✅ Verify token balance updated

**How to run:**
```bash
# Edit credentials di script terlebih dahulu
nano topup_complete_flow.sh

# Jalankan script
./topup_complete_flow.sh
```

**Requirements:**
- Server harus running
- User account dengan license key
- Payment webhook endpoint aktif

📖 **Documentation**: 
- [docs/TOPUP_FLOW.md](../docs/TOPUP_FLOW.md)
- [docs/TOPUP_API.md](../docs/TOPUP_API.md)

---

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Start the server
npm run dev

# Server akan running di http://localhost:3000
```

### 2. Edit Test Credentials

Edit file script dan ganti credentials:

```bash
# Example: token_usage_test.sh
nano token_usage_test.sh

# Update this section:
API_URL="http://localhost:3000"  # Your API URL
# Email dan password akan diminta saat login
```

### 3. Make Scripts Executable

```bash
chmod +x token_usage_test.sh
chmod +x topup_complete_flow.sh
```

### 4. Run Tests

```bash
# Test token usage
./token_usage_test.sh

# Test top-up flow
./topup_complete_flow.sh
```

---

## 📋 Script Details

### Token Usage Test Flow

```
┌─────────────────┐
│  Login User     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get License Key │
│ & Balance       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Use Token       │
│ (Basic)         │ → Balance - 1
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Use Token       │
│ (With Metadata) │ → Balance - 1
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Final    │
│ Balance         │
└─────────────────┘
```

### Top-up Test Flow

```
┌─────────────────┐
│  Login User     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Current   │
│ Balance         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Request Top-up  │
│ (Create TX)     │ → Status: PENDING
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Simulate        │
│ Payment Webhook │ → Status: SUCCESS
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Balance  │
│ Updated         │ → Balance + Tokens
└─────────────────┘
```

---

## 🔧 Customization

### Modify API URL

```bash
# Change API base URL in scripts
API_URL="https://your-production-api.com"
```

### Add More Tests

Create new test scripts following the pattern:

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
JWT_TOKEN=""

# Test logic here
# ...
```

---

## 📊 Expected Output

### ✅ Success Output

```
==========================================
Token Usage API Test
==========================================

Step 1: Login to get JWT token
✓ Login successful! Token obtained.

Step 2: Get token balance and license keys
✓ License key found: 123e4567-...

Step 3: Use token (basic request)
✓ Token used successfully!
Previous balance: 100
New balance: 99
Tokens used: 1

Step 4: Use token with purpose and metadata
✓ Token used successfully with metadata!
Previous balance: 99
New balance: 98
Tokens used: 1

Step 5: Verify updated token balance
✓ Current total balance: 98

==========================================
Test completed successfully!
==========================================
```

### ❌ Error Output

```
Error: Failed to get JWT token. Please check your credentials.
Error: No license key found. Please assign a license key to your account.
Error: Insufficient token balance
```

---

## 🐛 Troubleshooting

### "Connection refused"
- Check if server is running
- Verify API_URL is correct
- Check port (default: 3000)

### "Login failed"
- Verify email and password
- Check if email is verified
- Try reset password if needed

### "No license key found"
- Assign license key to user via admin panel
- Check license key status (must be active/trial)

### "Insufficient token balance"
- Top-up tokens first
- Check current balance via API

### "Command not found: curl"
- Install curl: `brew install curl` (macOS)
- Or use Postman instead

---

## 📚 Additional Resources

- **API Documentation**: http://localhost:3000/api-docs
- **Complete Docs**: [docs/README.md](../docs/README.md)
- **Database Setup**: [database/README.md](../database/README.md)

---

## 💡 Tips

1. **Use jq for pretty JSON output:**
   ```bash
   curl ... | jq
   ```

2. **Save response to file:**
   ```bash
   curl ... > response.json
   ```

3. **Verbose output for debugging:**
   ```bash
   curl -v ...
   ```

4. **Test in different environments:**
   ```bash
   # Development
   API_URL="http://localhost:3000"
   
   # Staging
   API_URL="https://staging-api.example.com"
   
   # Production
   API_URL="https://api.example.com"
   ```

---

**Last Updated**: December 23, 2025
