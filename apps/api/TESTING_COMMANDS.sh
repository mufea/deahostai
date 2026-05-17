#!/bin/bash

# Text Generator Testing Commands
# Run these commands to test the text generation endpoint

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Text Generator Testing Suite ===${NC}\n"

# Test 1: Check if server is running
echo -e "${YELLOW}Test 1: Checking if server is running on port 3001...${NC}"
curl -s http://localhost:3001/health > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Server is running${NC}\n"
else
    echo -e "${RED}✗ Server is not running. Start it with: npm run dev${NC}\n"
    exit 1
fi

# Test 2: Check environment variables
echo -e "${YELLOW}Test 2: Checking environment variables...${NC}"
if grep -q "OPENAI_API_KEY=" .env; then
    echo -e "${GREEN}✓ OPENAI_API_KEY is set${NC}"
else
    echo -e "${RED}✗ OPENAI_API_KEY is not set${NC}"
fi

if grep -q "GOOGLE_GEMINI_API_KEY=" .env; then
    echo -e "${GREEN}✓ GOOGLE_GEMINI_API_KEY is set${NC}"
else
    echo -e "${RED}✗ GOOGLE_GEMINI_API_KEY is not set${NC}"
fi

if grep -q "ANTHROPIC_API_KEY=" .env; then
    echo -e "${GREEN}✓ ANTHROPIC_API_KEY is set${NC}"
else
    echo -e "${RED}✗ ANTHROPIC_API_KEY is not set${NC}"
fi

if grep -q "DEEPSEEK_API_KEY=" .env; then
    echo -e "${GREEN}✓ DEEPSEEK_API_KEY is set${NC}"
else
    echo -e "${RED}✗ DEEPSEEK_API_KEY is not set${NC}"
fi
echo ""

# Test 3: Test text generation endpoint (requires auth token)
echo -e "${YELLOW}Test 3: Testing text generation endpoint...${NC}"
echo -e "${YELLOW}Note: You need a valid auth token. Replace YOUR_AUTH_TOKEN with actual token.${NC}"
echo ""
echo -e "${YELLOW}Example cURL command:${NC}"
echo 'curl -X POST http://localhost:3001/text/generate \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \'
echo '  -d '{'
echo '    "message": "Hello, how are you?",'
echo '    "model_id": "gpt-3.5-turbo",'
echo '    "temperature": 0.7,'
echo '    "top_p": 1.0,'
echo '    "max_tokens": 2048'
echo '  }'
echo "'"
echo ""

# Test 4: Check route registration
echo -e "${YELLOW}Test 4: Checking route registration...${NC}"
if grep -q "router.use('/text'" src/routes/index.js; then
    echo -e "${GREEN}✓ Text route is registered${NC}"
else
    echo -e "${RED}✗ Text route is not registered${NC}"
fi

if grep -q "router.use('/integrated-ai'" src/routes/index.js; then
    echo -e "${GREEN}✓ Integrated AI route is registered${NC}"
else
    echo -e "${RED}✗ Integrated AI route is not registered${NC}"
fi
echo ""

# Test 5: Check provider files
echo -e "${YELLOW}Test 5: Checking provider implementations...${NC}"
for provider in openai gemini anthropic deepseek; do
    if [ -f "src/providers/${provider}.js" ]; then
        echo -e "${GREEN}✓ ${provider}.js exists${NC}"
    else
        echo -e "${RED}✗ ${provider}.js is missing${NC}"
    fi
done
echo ""

echo -e "${GREEN}=== Testing Complete ===${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Ensure all API keys in .env are valid"
echo "2. Start the server: npm run dev"
echo "3. Get a valid auth token from your frontend"
echo "4. Test the endpoint with the cURL command above"
echo "5. Check server logs for [TEXT] and provider-specific logs"