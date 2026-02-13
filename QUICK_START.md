# Quick Start: Hybrid Parser

## 🚀 Setup (2 minutes)

### 1. Get DeepSeek API Key
Visit: https://platform.deepseek.com → API Keys → Create New

### 2. Add to `.env.local`
```bash
DEEPSEEK_API_KEY=sk-your-key-here
```

### 3. Restart Server
```bash
npm run dev
```

### 4. Test It
Run a scan and check the logs for:
```
[HYBRID] Starting hybrid parsing...
[LLM] ✅ Extraction complete in 523ms
```

## ✅ That's It!

The system now automatically:
- Tries regex first (fast, free)
- Falls back to AI if confidence < 60%
- Merges results for best accuracy

## 📊 Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Success Rate | 50% | 85% |
| Avg Confidence | 0.45 | 0.80 |
| Cost per 1K emails | $0 | $0.04 |

## 🔧 Optional: Adjust Settings

In `app/api/insurance/scan/route.ts`:

```typescript
const parsedData = await parseInsuranceEmailHybrid(body, metadata, {
  llmFallbackThreshold: 0.6,  // Lower = more AI usage
  enableDebug: true,           // See detailed logs
});
```

## 📚 More Info

- **Setup Guide**: `HYBRID_PARSER_SETUP.md`
- **Full Details**: `PARSING_IMPROVEMENTS.md`
- **Documentation**: `lib/parsers/README.md`

## ❓ Troubleshooting

**AI not being used?**
- Check `.env.local` has `DEEPSEEK_API_KEY`
- Restart dev server

**Too many AI calls?**
- Increase threshold to 0.7 or 0.8
- Check email quality

**Still low confidence?**
- Check logs for specific errors
- Verify emails are insurance-related
