#!/bin/bash

# Token Usage Test Script
# This script demonstrates how to use the token usage endpoint

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Token Usage API Test"
echo "=========================================="
echo ""

# Configuration
API_URL="http://localhost:3000"
JWT_TOKEN="" # Will be set from login
LICENSE_KEY_ID="" # Will be set from token balance check

# Step 1: Login to get JWT token
echo -e "${YELLOW}Step 1: Login to get JWT token${NC}"
echo "Request: POST $API_URL/api/auth/login"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }')

echo "Response: $LOGIN_RESPONSE"
echo ""

# Extract JWT token
JWT_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$JWT_TOKEN" ]; then
  echo -e "${RED}Error: Failed to get JWT token. Please check your credentials.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Login successful! Token obtained.${NC}"
echo ""
sleep 1

# Step 2: Get token balance to find license key ID
echo -e "${YELLOW}Step 2: Get token balance and license keys${NC}"
echo "Request: GET $API_URL/api/user/token-balance"

BALANCE_RESPONSE=$(curl -s -X GET "$API_URL/api/user/token-balance" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response: $BALANCE_RESPONSE"
echo ""

# Extract first license key (the key string, not ID)
LICENSE_KEY=$(echo $BALANCE_RESPONSE | grep -o '"license_key":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$LICENSE_KEY" ]; then
  echo -e "${RED}Error: No license key found. Please assign a license key to your account.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ License key found: $LICENSE_KEY${NC}"
echo ""
sleep 1

# Step 3: Use token (basic - without body)
echo -e "${YELLOW}Step 3: Use token (simple - no body)${NC}"
echo "Request: POST $API_URL/api/user/license-keys/$LICENSE_KEY/use-token"

USE_TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/api/user/license-keys/$LICENSE_KEY/use-token" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response: $USE_TOKEN_RESPONSE"
echo ""

# Check if successful
if echo $USE_TOKEN_RESPONSE | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Token used successfully!${NC}"
  
  # Extract balances
  PREV_BALANCE=$(echo $USE_TOKEN_RESPONSE | grep -o '"previous_balance":[0-9]*' | cut -d':' -f2)
  NEW_BALANCE=$(echo $USE_TOKEN_RESPONSE | grep -o '"new_balance":[0-9]*' | cut -d':' -f2)
  
  echo -e "Previous balance: ${YELLOW}$PREV_BALANCE${NC}"
  echo -e "New balance: ${YELLOW}$NEW_BALANCE${NC}"
  echo -e "Tokens used: ${YELLOW}1${NC}"
else
  echo -e "${RED}✗ Failed to use token${NC}"
fi
echo ""
sleep 1

# Step 4: Use token with purpose and metadata (optional)
echo -e "${YELLOW}Step 4: Use token with purpose and metadata (optional)${NC}"
echo "Request: POST $API_URL/api/user/license-keys/$LICENSE_KEY/use-token"

USE_TOKEN_DETAILED=$(curl -s -X POST "$API_URL/api/user/license-keys/$LICENSE_KEY/use-token" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "Test API call with metadata",
    "metadata": {
      "endpoint": "/api/test",
      "method": "POST"
    }
  }')

echo "Response: $USE_TOKEN_DETAILED"
echo ""

if echo $USE_TOKEN_DETAILED | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Token used successfully with metadata!${NC}"
  
  # Extract balances
  PREV_BALANCE=$(echo $USE_TOKEN_DETAILED | grep -o '"previous_balance":[0-9]*' | cut -d':' -f2)
  NEW_BALANCE=$(echo $USE_TOKEN_DETAILED | grep -o '"new_balance":[0-9]*' | cut -d':' -f2)
  
  echo -e "Previous balance: ${YELLOW}$PREV_BALANCE${NC}"
  echo -e "New balance: ${YELLOW}$NEW_BALANCE${NC}"
  echo -e "Tokens used: ${YELLOW}1${NC}"
else
  echo -e "${RED}✗ Failed to use token${NC}"
fi
echo ""

# Step 5: Check updated balance
echo -e "${YELLOW}Step 5: Verify updated token balance${NC}"
echo "Request: GET $API_URL/api/user/token-balance"

FINAL_BALANCE=$(curl -s -X GET "$API_URL/api/user/token-balance" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response: $FINAL_BALANCE"
echo ""

TOTAL_BALANCE=$(echo $FINAL_BALANCE | grep -o '"total_balance":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}✓ Current total balance: ${YELLOW}$TOTAL_BALANCE${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}Test completed successfully!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Logged in and obtained JWT token"
echo "- Retrieved license keys and balances"
echo "- Used 2 tokens (1 simple + 1 with optional metadata)"
echo "- Verified final balance"
echo ""
echo "Note:"
echo "- Request body is OPTIONAL (can be empty)"
echo "- Each hit reduces balance by 1 token"
echo "- Use license key string (ABC12-XYZ34) not UUID"
