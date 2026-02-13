# Testing the Hybrid Parser

## Quick Test (3 Methods)

### Method 1: Using the Test Endpoint (Easiest)

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Run the test script:**
   ```bash
   ./test-parser.sh
   ```

   This will test 3 sample emails and show you the results.

3. **Check the terminal logs** for detailed parsing information:
   ```
   [HYBRID] Starting hybrid parsing...
   [HYBRID] Regex confidence: 0.85
   [HYBRID] ✅ Hybrid parsing complete
   ```

### Method 2: Using curl (Manual)

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Test with a sample email:**
   ```bash
   curl -X POST http://localhost:3000/api/test-parser \
     -H "Content-Type: application/json" \
     -d '{
       "emailText": "Dear Customer, Your premium for policy SH123456789 is ₹5,000. Due date: 15/03/2024",
       "from": "noreply@starhealth.in",
       "subject": "Premium Payment Due"
     }'
   ```

3. **Check the response** - you'll see:
   ```json
   {
     "success": true,
     "result": {
       "insurerName": "Star Health Insurance",
       "policyNumber": "SH123456789",
       "amount": 5000,
       "confidenceScore": 0.85
     }
   }
   ```

### Method 3: Using Your Browser

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open:** http://localhost:3000/api/test-parser

3. **You'll see sample emails** - copy one and use it in a POST request

4. **Or use the app:**
   - Go to http://localhost:3000
   - Sign in with Google
   - Click "Scan Emails" button
   - Watch the terminal logs

## What to Look For

### ✅ Success Indicators

**In Terminal Logs:**
```
[HYBRID] Starting hybrid parsing...
[HYBRID] Step 1: Regex extraction
[HYBRID] Regex confidence: 0.85
[HYBRID] ✅ Hybrid parsing complete in 12ms
```

**In API Response:**
```json
{
  "insurerName": "Star Health Insurance",
  "policyNumber": "SH123456789",
  "amount": 5000,
  "confidenceScore": 0.85  // > 0.6 is good!
}
```

### 🔄 LLM Fallback (When Regex Confidence is Low)

**In Terminal Logs:**
```
[HYBRID] Regex confidence: 0.45
[HYBRID] Step 2: LLM extraction (low confidence)
[LLM] Starting extraction with DeepSeek...
[LLM] ✅ Extraction complete in 523ms
[LLM] Confidence: 0.85
[HYBRID] ✅ Hybrid parsing complete in 545ms
```

### ⚠️ Without DeepSeek API Key

**In Terminal Logs:**
```
[HYBRID] Regex confidence: 0.45
[HYBRID] ⚠️ LLM needed but not configured, using regex results only
```

This is fine - it will still work, just with lower accuracy on unusual emails.

## Testing Different Scenarios

### Scenario 1: Well-Formatted Email (Regex Should Work)

```bash
curl -X POST http://localhost:3000/api/test-parser \
  -H "Content-Type: application/json" \
  -d '{
    "emailText": "Policy: SH123456789\nAmount: ₹5,000\nDue: 15/03/2024",
    "from": "noreply@starhealth.in"
  }'
```

**Expected:**
- Regex confidence: ~0.85
- No LLM call needed
- Fast response (~10ms)

### Scenario 2: Poorly Formatted Email (Needs LLM)

```bash
curl -X POST http://localhost:3000/api/test-parser \
  -H "Content-Type: application/json" \
  -d '{
    "emailText": "Hi! Your insurance payment of five thousand rupees is due next month.",
    "from": "reminders@insurance.com"
  }'
```

**Expected:**
- Regex confidence: ~0.40
- LLM fallback triggered
- Slower response (~500ms)
- Higher final confidence (~0.80)

### Scenario 3: Complex Format

```bash
curl -X POST http://localhost:3000/api/test-parser \
  -H "Content-Type: application/json" \
  -d '{
    "emailText": "Policy No: HDFC/HI/2024/789456\nBase: Rs. 12,500/-\nGST: Rs. 2,250/-\nTotal: Rs. 14,750/-\nDue: 20th March 2024",
    "from": "renewals@hdfcergo.com"
  }'
```

**Expected:**
- Regex confidence: ~0.70
- May or may not trigger LLM (depends on threshold)
- Good extraction either way

## Comparing Results

### Before (Regex Only)

```json
{
  "insurerName": null,
  "policyNumber": "0902",
  "amount": 5000,
  "dueDate": null,
  "confidenceScore": 0.35
}
```

### After (Hybrid with LLM)

```json
{
  "insurerName": "Health Insurance Company",
  "policyNumber": "XXXXXXX0902",
  "amount": 5000,
  "dueDate": "2024-03-15",
  "confidenceScore": 0.85
}
```

## Monitoring in Production

When you run a real scan:

1. **Go to Dashboard** → Click "Scan Emails"

2. **Watch Terminal Logs:**
   ```
   [SCAN] Found messages: 25
   [SCAN] Processing message 1/25...
   [HYBRID] Regex confidence: 0.85 ✅
   [SCAN] Processing message 2/25...
   [HYBRID] Regex confidence: 0.45
   [LLM] Starting extraction... 🤖
   [LLM] ✅ Extraction complete
   ```

3. **Check Results:**
   - Saved count should be higher
   - Confidence scores should be better
   - Fewer errors

## Troubleshooting

### "LLM needed but not configured"

**Solution:** Add DeepSeek API key to `.env.local`:
```bash
DEEPSEEK_API_KEY=sk-your-key-here
```

### "DeepSeek API error: 401"

**Solution:** Check your API key is correct and active at https://platform.deepseek.com

### "Too many LLM calls (>50%)"

**Solution:** Increase threshold in `app/api/insurance/scan/route.ts`:
```typescript
llmFallbackThreshold: 0.7,  // Was 0.6
```

### "Still low confidence scores"

**Solution:** 
1. Check if emails are actually insurance-related
2. Verify insurer is in company mapping
3. Enable debug mode to see detailed logs

## Performance Benchmarks

Run the test script and compare:

| Metric | Target | Your Result |
|--------|--------|-------------|
| Regex-only speed | < 20ms | ___ ms |
| LLM fallback speed | < 1000ms | ___ ms |
| Regex confidence | > 0.7 | ___ |
| LLM confidence | > 0.8 | ___ |
| LLM usage rate | 30-40% | ___% |

## Next Steps

1. ✅ Run `./test-parser.sh` to verify setup
2. ✅ Add DeepSeek API key if not done
3. ✅ Run a real scan with your Gmail account
4. ✅ Monitor logs and confidence scores
5. ✅ Adjust threshold if needed

## Need Help?

Check the logs for specific error messages and refer to:
- `HYBRID_PARSER_SETUP.md` - Setup guide
- `PARSING_IMPROVEMENTS.md` - Technical details
- `lib/parsers/README.md` - API documentation
