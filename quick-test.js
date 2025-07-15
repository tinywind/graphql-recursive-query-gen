#!/usr/bin/env node

/**
 * Quick test script to verify the tool is working correctly
 * Usage: node quick-test.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Quick Test for GraphQL Query Generator\n');

// Create a simple test schema
const testSchema = `
type Query {
  hello: String!
  getItem(id: ID!): Item
}

type Mutation {
  createItem(name: String!): Item!
}

type Item {
  id: ID!
  name: String!
  createdAt: String!
}
`;

// Create test directory and schema file
const testDir = 'quick-test-output';
const schemaFile = 'test-schema.graphqls';

try {
  // Setup
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(schemaFile, testSchema);
  console.log('✓ Created test schema\n');

  // Run the generator
  console.log('Running generator...');
  execSync(`node generate-graphql-files.cjs ${testDir} ${schemaFile} false`, { stdio: 'inherit' });

  console.log('\n✓ Generation completed!\n');

  // Check results
  console.log('Generated files:');
  const files = fs.readdirSync(testDir);
  files.forEach(file => {
    console.log(`  - ${file}`);
  });

  // Show sample content
  if (files.length > 0) {
    console.log('\nSample generated content:');
    console.log('─'.repeat(50));
    const sampleFile = path.join(testDir, files[0]);
    console.log(fs.readFileSync(sampleFile, 'utf-8'));
    console.log('─'.repeat(50));
  }

  // Cleanup
  console.log('\nCleaning up...');
  fs.rmSync(testDir, { recursive: true });
  fs.unlinkSync(schemaFile);

  console.log('\n✅ Quick test completed successfully!');
} catch (error) {
  console.error('\n❌ Test failed:', error.message);

  // Cleanup on error
  try {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
    if (fs.existsSync(schemaFile)) fs.unlinkSync(schemaFile);
  } catch {}

  process.exit(1);
}
