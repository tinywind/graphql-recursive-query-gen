#!/bin/bash

echo "🧪 GraphQL Query Generator - Local Test Suite"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Create test directories
echo -e "${YELLOW}Setting up test environment...${NC}"
mkdir -p test-output/{basic,fragments,postfix,multi-schema}
mkdir -p examples/multi-schema

# Create additional schema files for multi-schema test
cat > examples/multi-schema/auth.graphqls << 'EOF'
extend type Query {
  me: User
  validateToken(token: String!): Boolean!
}

extend type Mutation {
  login(email: String!, password: String!): AuthPayload!
  logout: Boolean!
  refreshToken(refreshToken: String!): AuthPayload!
}

type AuthPayload {
  user: User!
  token: String!
  refreshToken: String!
}
EOF

cat > examples/multi-schema/subscription.graphqls << 'EOF'
type Subscription {
  postAdded(userId: ID): Post!
  commentAdded(postId: ID!): Comment!
  userStatusChanged(userId: ID!): User!
}
EOF

# Make the script executable
chmod +x generate-graphql-files.cjs

# Add shebang if not present
if ! head -n1 generate-graphql-files.cjs | grep -q "^#!/usr/bin/env node"; then
  echo "#!/usr/bin/env node" | cat - generate-graphql-files.cjs > temp && mv temp generate-graphql-files.cjs
  chmod +x generate-graphql-files.cjs
fi

echo -e "${GREEN}✓ Test environment ready${NC}\n"

# Test 1: Basic generation without fragments
echo -e "${YELLOW}Test 1: Basic generation (no fragments)${NC}"
node generate-graphql-files.cjs test-output/basic examples/sample-schema.graphqls false
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Test 1 passed${NC}"
  echo "Generated files:"
  ls -la test-output/basic/*.graphql | head -5
else
  echo -e "${RED}✗ Test 1 failed${NC}"
fi
echo ""

# Test 2: Generation with fragments
echo -e "${YELLOW}Test 2: Generation with fragments${NC}"
node generate-graphql-files.cjs test-output/fragments examples/sample-schema.graphqls true
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Test 2 passed${NC}"
  echo "Generated fragment files:"
  ls -la test-output/fragments/*-fragment.graphql | head -5
else
  echo -e "${RED}✗ Test 2 failed${NC}"
fi
echo ""

# Test 3: Generation with postfix
echo -e "${YELLOW}Test 3: Generation with custom postfix${NC}"
node generate-graphql-files.cjs test-output/postfix examples/sample-schema.graphqls true V2
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Test 3 passed${NC}"
  echo "Sample generated file with postfix:"
  head -n 5 test-output/postfix/GetUser-query.graphql
else
  echo -e "${RED}✗ Test 3 failed${NC}"
fi
echo ""

# Test 4: Multi-schema generation (directory)
echo -e "${YELLOW}Test 4: Multi-schema generation from directory${NC}"
node generate-graphql-files.cjs test-output/multi-schema examples/multi-schema true
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Test 4 passed${NC}"
  echo "Generated files from multiple schemas:"
  ls -la test-output/multi-schema/*.graphql | grep -E "(Login|ValidateToken|PostAdded)" | head -5
else
  echo -e "${RED}✗ Test 4 failed${NC}"
fi
echo ""

# Test 5: Glob pattern
echo -e "${YELLOW}Test 5: Glob pattern test${NC}"
node generate-graphql-files.cjs test-output/glob "examples/**/*.graphqls" false
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Test 5 passed${NC}"
  echo "Files found and processed:"
  ls -la test-output/glob/*.graphql | wc -l
else
  echo -e "${RED}✗ Test 5 failed${NC}"
fi
echo ""

# Validate generated content
echo -e "${YELLOW}Validating generated content...${NC}"
if [ -f "test-output/basic/GetUser-query.graphql" ]; then
  echo -e "${GREEN}✓ Query file generated correctly${NC}"
  echo "Sample content:"
  cat test-output/basic/GetUser-query.graphql
else
  echo -e "${RED}✗ Query file not found${NC}"
fi
echo ""

if [ -f "test-output/fragments/User-fragment.graphql" ]; then
  echo -e "${GREEN}✓ Fragment file generated correctly${NC}"
  echo "Sample content:"
  cat test-output/fragments/User-fragment.graphql
else
  echo -e "${RED}✗ Fragment file not found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Local tests completed!${NC}"
echo ""
echo "To test with npm link:"
echo "  npm link"
echo "  gql-gen test-output/npm-link examples/sample-schema.graphqls false"
