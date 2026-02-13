# How to Test the Hybrid Parser

## 🚀 Quick Test (30 seconds)

### 1. Start Server
```bash
npm run dev
```

### 2. Run Test Script
```bash
./test-parser.sh
```

### 3. Check Output
You should see results like:
```json
{
  "insurerName": "Star Health Insurance",
  "policyNumber": "SH123456789",
  "amount": 5000,
  "confidenceScore": 0.85
}
```

### 4. Check Terminal Logs
Look for:
```
[HYBRID] Starting hybrid parsing...
[HYBRID] ✅ Hybrid parsing complete in 12ms
```

## ✅ That's It!

If you see results with confidence > 0.6, it's working!

---

## 🔧 Optional: Add DeepSeek for Better Accuracy

### 1. Get API Key
- Go to https://platform.deepseek.com
- Sign up and create an API key

### 2. Add to `.env.local`
```bash
DEEPSEEK_API_KEY=sk-your-key-here
```

### 3. Restart Server
```bash
npm run dev
```

### 4. Test Again
```bash
./test-parser.sh
```

Now you'll see LLM being used for low-confidence emails:
```
[HYBRID] Regex confidence: 0.45
[LLM] Starting extraction with DeepSeek...
[LLM] ✅ Extraction complete in 523ms
[HYBRID] Final confidence: 0.85
```

---

## 📊 Test with Real Emails

### 1. Open App
```
http://localhost:3000
```

### 2. Sign In
Use your Google account

### 3. Scan Emails
Click "Scan Emails" button on Dashboard

### 4. Watch Logs
Check terminal for parsing details

---

## 📝 What to Look For

### ✅ Good Signs
- Confidence scores > 0.6
- Most fields extracted correctly
- Fast processing (< 200ms average)
- LLM used for ~30-40% of emails

### ⚠️ Warning Signs
- Confidence scores < 0.5
- Many missing fields
- LLM used for > 60% of emails
- API errors

---

## 🐛 Troubleshooting

### Test script not working?
```bash
chmod +x test-parser.sh
./test-parser.sh
```

### Server not running?
```bash
npm run dev
```

### Want to see detailed logs?
Check your terminal where `npm run dev` is running

### Need more help?
See `TESTING_GUIDE.md` for detailed instructions

---

## 📚 More Info

- **Quick Setup**: `QUICK_START.md`
- **Detailed Testing**: `TESTING_GUIDE.md`
- **Full Documentation**: `PARSING_IMPROVEMENTS.md`
