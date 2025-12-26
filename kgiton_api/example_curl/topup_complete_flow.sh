#!/bin/bash

# KGiTON API - Complete Top-up Flow Testing Script
# ================================================

# Configuration
BASE_URL="http://localhost:3000"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6IkpzRHJ5MGdZSVVaYWhVRGgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3ZtcnhvY2J1bGJ5eHBubm55bXFhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiNTIxMjMwYi0yNGQ4LTQ1NmYtYTFlZi0wMTlmMzA2YmY5YTEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY2MzczNjY0LCJpYXQiOjE3NjYzNzAwNjQsImVtYWlsIjoic2FuZGlraGFAa2dpdG9uLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY2MzcwMDY0fV0sInNlc3Npb25faWQiOiI4Y2QxMjQxNS05N2UzLTQ1NjQtYWVjYy0wMzZiNGQ0OTMzODgiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.UicONLDAlXuFXTCEFrAN7Zi2oQTt-EdlER9FTbNzA7g"
LICENSE_KEY="CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E"
TOKEN_COUNT=750

echo "========================================"
echo "KGiTON API - Top-up Flow Test"
echo "========================================"
echo ""

# Step 1: Request Top-up
echo "Step 1: Requesting top-up..."
echo "----------------------------------------"
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/topup/request" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"token_count\": ${TOKEN_COUNT},
    \"license_key\": \"${LICENSE_KEY}\"
  }")

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Extract transaction_id
TRANSACTION_ID=$(echo "$RESPONSE" | jq -r '.data.transaction_id')

if [ "$TRANSACTION_ID" == "null" ] || [ -z "$TRANSACTION_ID" ]; then
    echo "❌ Error: Failed to create transaction"
    exit 1
fi

echo "✅ Transaction created: $TRANSACTION_ID"
echo ""
echo "Status: PENDING (menunggu pembayaran)"
echo ""

# Wait for user input
read -p "Press Enter to simulate payment success (or Ctrl+C to cancel)..." 

# Step 2: Simulate Payment Webhook (Success)
echo ""
echo "Step 2: Simulating payment webhook (SUCCESS)..."
echo "----------------------------------------"
WEBHOOK_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/webhook/payment" \
  -H "Content-Type: application/json" \
  -d "{
    \"transaction_id\": \"${TRANSACTION_ID}\",
    \"order_id\": \"TEST-ORDER-$(date +%s)\",
    \"status\": \"success\"
  }")

echo "Response:"
echo "$WEBHOOK_RESPONSE" | jq '.'
echo ""

# Check if successful
if echo "$WEBHOOK_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Payment processed successfully!"
else
    echo "❌ Payment processing failed"
    exit 1
fi

echo ""

# Step 3: Check Transaction Status
echo "Step 3: Checking transaction status..."
echo "----------------------------------------"
STATUS_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/topup/status/${TRANSACTION_ID}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}")

echo "Response:"
echo "$STATUS_RESPONSE" | jq '.'
echo ""

# Display final status
FINAL_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.status')
TOKENS_ADDED=$(echo "$STATUS_RESPONSE" | jq -r '.data.tokens_added')

echo "========================================"
echo "✅ Top-up Flow Completed!"
echo "========================================"
echo "Transaction ID: $TRANSACTION_ID"
echo "Status: $FINAL_STATUS"
echo "Tokens Added: $TOKENS_ADDED"
echo "========================================"
