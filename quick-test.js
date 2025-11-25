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

type Subscription {
  itemCreated(userId: ID): Item!
  itemUpdated(id: ID!): Item!
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

  // Verify expected files exist
  const expectedFiles = {
    query: ['Hello-query.graphql', 'GetItem-query.graphql'],
    mutation: ['CreateItem-mutation.graphql'],
    subscription: ['ItemCreated-subscription.graphql', 'ItemUpdated-subscription.graphql']
  };

  console.log('\n📋 Verification:');
  let allPassed = true;

  Object.entries(expectedFiles).forEach(([type, fileList]) => {
    console.log(`\n  ${type.toUpperCase()}:`);
    fileList.forEach(expectedFile => {
      const exists = files.includes(expectedFile);
      console.log(`    ${exists ? '✓' : '✗'} ${expectedFile}`);
      if (!exists) allPassed = false;
    });
  });

  // Show subscription file contents
  console.log('\n📄 Subscription file contents:');
  expectedFiles.subscription.forEach(subFile => {
    if (files.includes(subFile)) {
      console.log(`\n  [${subFile}]`);
      console.log('─'.repeat(50));
      const content = fs.readFileSync(path.join(testDir, subFile), 'utf-8');
      console.log(content);
      console.log('─'.repeat(50));

      // Verify content starts with 'subscription'
      if (!content.trim().startsWith('subscription')) {
        console.log('  ✗ ERROR: File should start with "subscription"');
        allPassed = false;
      } else {
        console.log('  ✓ Content verified');
      }
    }
  });

  if (!allPassed) {
    throw new Error('Some verification checks failed');
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
