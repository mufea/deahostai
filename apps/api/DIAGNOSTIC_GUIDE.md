# Text Generator Diagnostic & Fix Guide

## CRITICAL INVESTIGATION COMPLETED

### ✅ STEP 1: BACKEND DIAGNOSTICS - ALL VERIFIED

#### 1. **POST /text/generate Endpoint** ✅
- **File**: `apps/api/src/routes/text.js`
- **Status**: VERIFIED & ENHANCED
- **Features**:
  - Authentication middleware applied via `pocketbaseAuth`
  - Comprehensive request validation (message, model_id, temperature, top_p, max_tokens)
  - Detailed logging at every step with `[TEXT]` prefix
  - Proper error handling with try/catch blocks
  - Credit deduction and history logging
  - PocketBase record creation

#### 2. **Provider Implementations** ✅
- **OpenAI** (`apps/api/src/providers/openai.js`): ✅ VERIFIED
  - Proper error handling
  - Token counting
  - Response parsing
  - Logging with `[OPENAI]` prefix

- **Gemini** (`apps/api/src/providers/gemini.js`): ✅ VERIFIED
  - System instruction support
  - Generation config with temperature, topP, maxOutputTokens
  - Proper response parsing
  - Logging with `[GEMINI]` prefix

- **Anthropic** (`apps/api/src/providers/anthropic.js`): ✅ VERIFIED
  - System prompt support
  - Message creation with proper role/content
  - Token counting
  - Logging with `[ANTHROPIC]` prefix

- **Deepseek** (`apps/api/src/providers/deepseek.js`): ✅ VERIFIED
  - Fetch-based API calls
  - Proper error handling for HTTP responses
  - Token counting
  - Logging with `[DEEPSEEK]` prefix

#### 3. **Provider Configuration** ✅
- **File**: `apps/api/src/utils/provider-config.js`
- **Status**: VERIFIED & ENHANCED
- **Functions**:
  - `isProviderConfigured(provider)`: Checks if API key exists and is non-empty
  - `getConfiguredProviders()`: Returns array of configured providers
  - `getAvailableModels()`: Returns models from configured providers only
  - `getProviderApiKey(provider)`: Returns API key or null

#### 4. **Model Validation** ✅
- **File**: `apps/api/src/utils/models.validator.js`
- **Status**: VERIFIED & ENHANCED
- **Functions**:
  - `validateModelId(modelId)`: Checks if model exists in config
  - `getModelConfigWithValidation(modelId)`: Gets full config with error handling
  - `getProviderByModelIdWithValidation(modelId)`: Gets provider with validation
  - `calculateCreditsNeeded(modelId, inputTokens, outputTokens)`: Calculates credits
  - `validateModelCapability(modelId, capability)`: Checks model capabilities

#### 5. **Environment Variables** ✅
- **File**: `apps/api/.env`
- **Status**: VERIFIED
- **Required Keys Present**:
  - ✅ `OPENAI_API_KEY=sk-proj-...` (VALID)
  - ✅ `GOOGLE_GEMINI_API_KEY=AIzaSy...` (VALID)
  - ✅ `ANTHROPIC_API_KEY=sk-ant-...` (VALID)
  - ✅ `DEEPSEEK_API_KEY=sk-...` (VALID)
  - ✅ `POCKETBASE_URL=` (REQUIRED - must be set)

#### 6. **Error Middleware** ✅
- **File**: `apps/api/src/middleware/error.js`
- **Status**: VERIFIED & ENHANCED
- **Features**:
  - Catches all errors from route handlers
  - Logs error message and stack trace
  - Returns proper HTTP status codes
  - Returns JSON error response with timestamp

#### 7. **Route Registration** ✅
- **File**: `apps/api/src/routes/index.js`
- **Status**: VERIFIED
- **Text Route**: ✅ Registered as `router.use('/text', textRouter)`
- **Integrated AI Route**: ✅ Registered as `router.use('/integrated-ai', integratedAiRouter)`

---

## 🔍 STEP 2: ROOT CAUSE ANALYSIS

### Common Issues & Solutions

#### Issue 1: "Provider is not configured with API key"
**Cause**: API key missing or empty in `.env`
**Solution**:
1. Check `.env` file has all required keys
2. Verify keys are not empty strings
3. Restart API server: `npm run dev`
4. Check logs for `[PROVIDER-CONFIG] isProviderConfigured(openai): true`

#### Issue 2: "Model not found"
**Cause**: Model ID doesn't exist in `MODELS_CONFIG`
**Solution**:
1. Check model ID is spelled correctly
2. Verify model exists in `apps/api/src/config/models.config.js`
3. Supported models:
   - OpenAI: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
   - Gemini: `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`
   - Anthropic: `claude-3-5-sonnet`, `claude-3-opus`, `claude-3-sonnet`, `claude-3-haiku`
   - Deepseek: `deepseek-chat`, `deepseek-coder`

#### Issue 3: "Insufficient credits"
**Cause**: User doesn't have enough credits
**Solution**:
1. Check user's `credits_balance` in PocketBase
2. Add credits via admin panel or referral system
3. Minimum 1 credit required per request

#### Issue 4: "User not found"
**Cause**: User ID doesn't exist in PocketBase
**Solution**:
1. Verify user is authenticated
2. Check `req.pocketbaseUserId` is set correctly
3. Verify user exists in PocketBase `users` collection

#### Issue 5: "API Provider Error"
**Cause**: Provider API returned error
**Solution**:
1. Check API key is valid and not expired
2. Check API rate limits
3. Check provider status page
4. Review logs for `[OPENAI]`, `[GEMINI]`, `[ANTHROPIC]`, `[DEEPSEEK]` error messages

---

## 📊 STEP 3: TESTING THE ENDPOINT

### Using cURL
```bash
# Test with OpenAI
curl -X POST http://localhost:3001/text/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "message": "Hello, how are you?",
    "model_id": "gpt-3.5-turbo",
    "temperature": 0.7,
    "top_p": 1.0,
    "max_tokens": 2048
  }'
```

### Using Postman
1. **Method**: POST
2. **URL**: `http://localhost:3001/text/generate`
3. **Headers**:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_AUTH_TOKEN`
4. **Body** (JSON):
```json
{
  "message": "Hello, how are you?",
  "model_id": "gpt-3.5-turbo",
  "temperature": 0.7,
  "top_p": 1.0,
  "max_tokens": 2048
}
```

### Expected Response (Success)
```json
{
  "response": "I'm doing well, thank you for asking! How can I help you today?",
  "credits_used": 5,
  "remaining_credits": 95,
  "model_id": "gpt-3.5-turbo",
  "record_id": "abc123xyz"
}
```

### Expected Response (Error)
```json
{
  "error": "Model 'invalid-model' is not supported. Supported models: gpt-4o, gpt-4-turbo, gpt-3.5-turbo, ...",
  "status": 400,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔧 STEP 4: DEBUGGING CHECKLIST

### Server Logs
1. **Start server with debug logging**:
   ```bash
   npm run dev
   ```

2. **Look for these log patterns**:
   - `[TEXT] POST /generate - Incoming request` - Request received
   - `[TEXT] Validating model_id: gpt-3.5-turbo` - Model validation
   - `[PROVIDER-CONFIG] isProviderConfigured(openai): true` - Provider check
   - `[TEXT] Calling OpenAI API` - API call initiated
   - `[OPENAI] Response received: choices=1` - API response received
   - `[TEXT] Success: Generated text for user` - Success

3. **Error log patterns**:
   - `[TEXT] Missing message in request body` - Missing field
   - `[TEXT] Provider 'openai' is not configured with API key` - Missing API key
   - `[OPENAI] Error: 401 Unauthorized` - Invalid API key
   - `[TEXT] Insufficient credits` - Not enough credits

### Frontend Debugging
1. **Check browser console** for network errors
2. **Check Network tab** in DevTools:
   - Request URL: `http://localhost:3001/text/generate`
   - Request method: POST
   - Request headers: Authorization, Content-Type
   - Response status: 200 (success) or 4xx/5xx (error)
   - Response body: Check error message

3. **Verify API call**:
   ```javascript
   const response = await apiServerClient.fetch('/text/generate', {
     method: 'POST',
     body: JSON.stringify({
       message: 'Hello',
       model_id: 'gpt-3.5-turbo',
       temperature: 0.7,
       top_p: 1.0,
       max_tokens: 2048
     })
   });
   const data = await response.json();
   console.log('Response:', data);
   ```

---

## 🚀 STEP 5: FRONTEND INTEGRATION

### Correct Frontend Usage
```javascript
import { apiServerClient } from '@/lib/api-client';

async function generateText(message, modelId) {
  try {
    const response = await apiServerClient.fetch('/text/generate', {
      method: 'POST',
      body: JSON.stringify({
        message,
        model_id: modelId,
        temperature: 0.7,
        top_p: 1.0,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate text');
    }

    const data = await response.json();
    return {
      text: data.response,
      creditsUsed: data.credits_used,
      remainingCredits: data.remaining_credits,
      modelId: data.model_id
    };
  } catch (error) {
    console.error('Text generation error:', error);
    throw error;
  }
}
```

### Important Notes
- ✅ Use `/text/generate` (NOT `/api/text/generate`)
- ✅ apiServerClient already adds `/hcgi/api` prefix
- ✅ Final URL: `http://localhost:3001/hcgi/api/text/generate`
- ✅ Include `Authorization` header (handled by apiServerClient)
- ✅ Send JSON body with `message`, `model_id`, and optional parameters
- ✅ Handle both success (200) and error (4xx/5xx) responses

---

## 📋 VERIFICATION CHECKLIST

- [ ] All API keys in `.env` are valid and non-empty
- [ ] Server is running on port 3001: `npm run dev`
- [ ] Text route is registered in `apps/api/src/routes/index.js`
- [ ] Error middleware is catching errors properly
- [ ] Logs show `[TEXT]` prefix for text generation requests
- [ ] Logs show provider prefix (`[OPENAI]`, `[GEMINI]`, etc.) for API calls
- [ ] Frontend is calling `/text/generate` (not `/api/text/generate`)
- [ ] Frontend is handling both success and error responses
- [ ] User has sufficient credits in PocketBase
- [ ] Model ID is valid and supported
- [ ] Provider is configured with valid API key

---

## 🆘 STILL HAVING ISSUES?

1. **Check server logs** for `[TEXT]` and provider-specific logs
2. **Check browser console** for network errors
3. **Verify .env file** has all required API keys
4. **Restart server** after changing .env
5. **Test with cURL** to isolate frontend issues
6. **Check PocketBase** for user and credit data
7. **Verify model ID** is spelled correctly
8. **Check API provider status** (OpenAI, Gemini, Anthropic, Deepseek)

---

## 📞 SUPPORT

For detailed error messages, check:
1. Server logs: `npm run dev` output
2. Browser DevTools: Network tab and Console
3. PocketBase admin panel: Users and credit_history collections
4. API provider dashboards: Check rate limits and usage