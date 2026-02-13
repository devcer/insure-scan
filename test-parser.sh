#!/bin/bash

# Test Parser Script
# Tests the hybrid parser with sample emails

echo "=================================="
echo "Testing Hybrid Parser"
echo "=================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Server not running!"
    echo "Please start the dev server first:"
    echo "  npm run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Test 1: Well-formatted email
echo "Test 1: Well-formatted email (Star Health)"
echo "----------------------------------"
curl -s -X POST http://localhost:3000/api/test-parser \
  -H "Content-Type: application/json" \
  -d '{
    "emailText": "Dear Customer,\n\nYour premium payment for Star Health Insurance is due.\n\nPolicy Number: SH123456789\nPremium Amount: ₹5,000.00\nDue Date: 15/03/2024\nPayment Status: Pending\n\nThank you,\nStar Health Insurance",
    "from": "noreply@starhealth.in",
    "subject": "Premium Payment Due - Policy SH123456789"
  }' | jq '.result | {insurerName, policyNumber, amount, dueDate, confidenceScore}'

echo ""
echo ""

# Test 2: Poorly formatted email
echo "Test 2: Poorly formatted email (needs LLM)"
echo "----------------------------------"
curl -s -X POST http://localhost:3000/api/test-parser \
  -H "Content-Type: application/json" \
  -d '{
    "emailText": "Hi there!\n\nJust a quick reminder that your health insurance payment of five thousand rupees is coming up next month on the fifteenth of March.\n\nYour policy ending in 0902 needs to be renewed.\n\nThanks!",
    "from": "reminders@insurance.com",
    "subject": "Payment Reminder"
  }' | jq '.result | {insurerName, policyNumber, amount, dueDate, confidenceScore}'

echo ""
echo ""

# Test 3: Complex format
echo "Test 3: Complex format (HDFC ERGO)"
echo "----------------------------------"
curl -s -X POST http://localhost:3000/api/test-parser \
  -H "Content-Type: application/json" \
  -d '{
    "emailText": "HDFC ERGO Health Insurance\n\nPolicy Renewal Notice\n\nDear Valued Customer,\n\nThis is to inform you that your health insurance policy (Policy No: HDFC/HI/2024/789456) is due for renewal.\n\nPremium Details:\n- Base Premium: Rs. 12,500/-\n- GST (18%): Rs. 2,250/-\n- Total Payable: Rs. 14,750/-\n\nPayment Due: 20th March 2024\n\nFrequency: Annual\n\nRegards,\nHDFC ERGO Team",
    "from": "renewals@hdfcergo.com",
    "subject": "Policy Renewal Notice - HDFC/HI/2024/789456"
  }' | jq '.result | {insurerName, policyNumber, amount, dueDate, confidenceScore}'

echo ""
echo ""
echo "=================================="
echo "Tests Complete!"
echo "=================================="
echo ""
echo "Check your terminal logs for detailed parsing information"
echo ""
