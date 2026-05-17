# Integrated AI System - Quick Debug Guide

## 🚀 Quick Start

### Start Server with Debug Logging
```bash
LOG_LEVEL=debug npm run dev
```

### Monitor Specific Logs
```bash
# All integrated AI logs
npm run dev | grep "\[INTEGRATED-AI\]"

# Auth logs
npm run dev | grep "\[POCKETBASE-AUTH\]"

# Rate limit logs
npm run dev | grep "\[RATE-LIMIT\]"

# Route logs
npm run dev | grep "\[INTEGRATED-AI-ROUTE\]"
```

---

## 🔍 Diagnostic Checklist

### Step 1: Route Registration
```bash
# Check if route is registered
grep -n "router.use('/integrated-ai'" apps/api/src/routes/index.js
```
✅ Should output: `router.use('/integrated-ai', integratedAiRouter);`

### Step 2: API Key Validation
```bash
# Check if OPENAI_API_KEY is set
grep "OPENAI_API_KEY" apps/api/.env
```
✅ Should start with: `sk-proj-`

### Step 3: OpenAI Client Initialization
```bash
# Start server and look for this log
npm run dev | grep "OpenAI client initialized successfully"
```
✅ Should appear within first 5 seconds

### Step 4: Test Authentication
```bash
# Test with curl (replace TOKEN with actual token)
curl -X POST http://localhost:3001/integrated-ai/stream \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "[{\"type\":\"text\",\"text\":\"Hello\"}]"}'
```
✅ Should return SSE stream (not 401 error)

### Step 5: Test Rate Limiting
```bash
# Send 11 requests rapidly (should fail on 11th)
for i in {1..11}; do
  curl -X POST http://localhost:3001/integrated-ai/stream \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message": "[{\"type\":\"text\",\"text\":\"Test\"}]"}' &
done
```
✅ 11th request should return 429 (Too Many Requests)

---

## 🐛 Common Issues & Fixes

### Issue 1: "Route not found" (404)
**Logs to check**:
```
[INTEGRATED-AI-ROUTE] POST /stream - Incoming request
```

**If missing**: Route is not registered
```bash
# Fix: Add to apps/api/src/routes/index.js
import integratedAiRouter from './integrated-ai.js';
router.use('/integrated-ai', integratedAiRouter);
```

### Issue 2: "Failed to generate response"
**Logs to check**:
```
[INTEGRATED-AI] OpenAI client initialized successfully
[INTEGRATED-AI] Calling OpenAI API with streaming...
[INTEGRATED-AI] Stream error: ...
```

**If error**: Check API key
```bash
# Verify API key format
grep "OPENAI_API_KEY" apps/api/.env | head -c 50
# Should start with: sk-proj-
```

### Issue 3: "Invalid or expired token" (401)
**Logs to check**:
```
[POCKETBASE-AUTH] Token validation failed: ...
```

**If error**: Token is invalid or expired
```bash
# Get new token from frontend auth
# Ensure Authorization header format: "Bearer <token>"
```

### Issue 4: "Too many AI requests" (429)
**Logs to check**:
```
[RATE-LIMIT] Rate limit exceeded for IP: ...
```

**If error**: Wait 1 minute or adjust rate limit
```bash
# Adjust in apps/api/src/middleware/integrated-ai-rate-limit.js
windowMs: 60 * 1000,  // 1 minute
max: 10,              // 10 requests per minute
```

### Issue 5: "User not found"
**Logs to check**:
```
[INTEGRATED-AI] User verified: user@example.com
```

**If missing**: User doesn't exist in PocketBase
```bash
# Verify user exists in PocketBase admin panel
# Check users collection
```

---

## 📊 Log Analysis

### Successful Request Flow
```
[INTEGRATED-AI-ROUTE] POST /stream - Incoming request
[INTEGRATED-AI-ROUTE] User ID: user_123
[INTEGRATED-AI-ROUTE] Message length: 45
[POCKETBASE-AUTH] Token validated: user=user_123
[INTEGRATED-AI] stream() called: userId=user_123
[INTEGRATED-AI] User verified: user@example.com
[INTEGRATED-AI] Getting OpenAI client...
[INTEGRATED-AI] OpenAI client obtained successfully
[INTEGRATED-AI] Calling OpenAI API with streaming...
[INTEGRATED-AI] OpenAI API call successful, streaming response...
[INTEGRATED-AI] Received chunk: 15 characters
[INTEGRATED-AI] Stream complete: 500 characters received
[INTEGRATED-AI] Sent message_stop event
[INTEGRATED-AI] SSE stream closed successfully
```

### Error Request Flow
```
[INTEGRATED-AI-ROUTE] POST /stream - Incoming request
[INTEGRATED-AI-ROUTE] User ID: user_123
[POCKETBASE-AUTH] Token validation failed: Invalid token
[POCKETBASE-AUTH] Invalid token cleared from PocketBase client
# Response: 401 Unauthorized
```

---

## 🧪 Test Cases

### Test 1: Valid Request
```bash
curl -X POST http://localhost:3001/integrated-ai/stream \
  -H "Authorization: Bearer VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "[{\"type\":\"text\",\"text\":\"Hello world\"}]"}'
```
✅ Expected: SSE stream with content_block_delta events

### Test 2: Missing Message
```bash
curl -X POST http://localhost:3001/integrated-ai/stream \
  -H "Authorization: Bearer VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```
✅ Expected: 400 Bad Request - "message is required"

### Test 3: Invalid Token
```bash
curl -X POST http://localhost:3001/integrated-ai/stream \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "[{\"type\":\"text\",\"text\":\"Hello\"}]"}'
```
✅ Expected: 401 Unauthorized - "Invalid or expired token"

### Test 4: Message Too Long
```bash
curl -X POST http://localhost:3001/integrated-ai/stream \
  -H "Authorization: Bearer VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "[{\"type\":\"text\",\"text\":\"'$(printf 'a%.0s' {1..2001})'\"}]"}'
```
✅ Expected: 400 Bad Request - "message exceeds maximum length"

### Test 5: Rate Limit
```bash
# Send 11 requests in quick succession
for i in {1..11}; do
  curl -X POST http://localhost:3001/integrated-ai/stream \
    -H "Authorization: Bearer VALID_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message": "[{\"type\":\"text\",\"text\":\"Test\"}]"}' &
done
wait
```
✅ Expected: First 10 succeed, 11th returns 429 Too Many Requests

---

## 📝 Log Levels

### ERROR (Always shown)
```
LOG_LEVEL=error npm run dev
```
Shows only errors

### WARN (Default)
```
LOG_LEVEL=warn npm run dev
```
Shows warnings and errors

### INFO (Recommended)
```
LOG_LEVEL=info npm run dev
```
Shows info, warnings, and errors (default)

### DEBUG (Verbose)
```
LOG_LEVEL=debug npm run dev
```
Shows everything including debug messages

---

## 🔧 Configuration

### OpenAI Client Settings
**File**: `apps/api/src/api/integrated-ai.js`
```javascript
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,      // 30 seconds
  maxRetries: 2,       // Retry up to 2 times
});
```

### Rate Limit Settings
**File**: `apps/api/src/middleware/integrated-ai-rate-limit.js`
```javascript
windowMs: 60 * 1000,   // 1 minute window
max: 10,               // 10 requests per window
```

### Message Validation
**File**: `apps/api/src/routes/integrated-ai.js`
```javascript
if (message.length > 2000) {  // Max 2000 characters
  return res.status(400).json({ error: '...' });
}
```

---

## 🎯 Performance Monitoring

### Check Response Time
```bash
time curl -X POST http://localhost:3001/integrated-ai/stream \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "[{\"type\":\"text\",\"text\":\"Hello\"}]"}' \
  -w "\nTime: %{time_total}s\n"
```

### Monitor Memory Usage
```bash
# Watch memory while running
watch -n 1 'ps aux | grep "node src/main.js" | grep -v grep'
```

### Check OpenAI API Usage
```bash
# Monitor logs for token counts
npm run dev | grep "tokens="
```

---

## 📞 Support

If you encounter issues:

1. **Check logs** with appropriate log level
2. **Verify configuration** in .env file
3. **Test with curl** to isolate frontend issues
4. **Check PocketBase** for user and data issues
5. **Review error messages** in logs for details

All errors are logged with:
- Error message
- Error status code
- Full stack trace
- Context information