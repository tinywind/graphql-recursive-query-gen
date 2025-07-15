#!/bin/bash

# Example usage of graphql-recursive-query-gen
# This script demonstrates various usage scenarios

echo "GraphQL Query Generator - Example Usage"
echo "======================================"
echo ""

# Create output directories
mkdir -p output/{blog,ecommerce,fragments}

echo "1. Generating queries from blog schema (no fragments)..."
node ../generate-graphql-files.cjs output/blog sample-schema.graphqls false
echo "   ✓ Check output/blog/ for generated queries"
echo ""

echo "2. Generating queries from e-commerce schema with fragments..."
node ../generate-graphql-files.cjs output/ecommerce ecommerce-schema.graphqls true
echo "   ✓ Check output/ecommerce/ for queries and fragments"
echo ""

echo "3. Generating with custom postfix 'V2'..."
node ../generate-graphql-files.cjs output/fragments sample-schema.graphqls true V2
echo "   ✓ Check output/fragments/ for V2-suffixed operations"
echo ""

echo "Example outputs:"
echo "----------------"
echo ""
echo "📄 Blog Query Example:"
cat output/blog/GetUser-query.graphql 2>/dev/null | head -10
echo ""
echo "📄 E-commerce Fragment Example:"
cat output/ecommerce/Product-fragment.graphql 2>/dev/null | head -10
echo ""

echo "To use these files in your GraphQL client:"
echo "1. Import the generated .graphql files"
echo "2. Use them with your preferred GraphQL client library"
echo "3. The queries include all necessary variables and return fields"
