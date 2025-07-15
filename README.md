# graphql-recursive-query-gen

A powerful CLI tool that automatically generates GraphQL query and mutation files from GraphQL schemas. It supports multiple schema sources including local files, directories, glob patterns, and remote endpoints.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Output Structure](#output-structure)
- [Generated File Examples](#generated-file-examples)
- [Testing](#testing)
- [Advanced Features](#advanced-features)
- [Requirements](#requirements)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🚀 Generate query/mutation files from GraphQL schemas
- 📁 Support for multiple schema files (merge schemas)
- 🌐 Download schemas from remote GraphQL endpoints
- 🎯 Fragment generation support
- 🔍 Glob pattern support for schema discovery
- 📝 Customizable naming with postfix option

## Installation

### Global Installation

```bash
npm install -g graphql-recursive-query-gen
```

### Local Installation

```bash
npm install graphql-recursive-query-gen
```

### Using npx (without installation)

```bash
npx graphql-recursive-query-gen <outputDir> <schemaPath> <withFragment> [namePostfix]
```

## Usage

### Basic Command

```bash
# With global installation
gql-gen <outputDir> <schemaPath> <withFragment> [namePostfix]

# With local installation
npx gql-gen <outputDir> <schemaPath> <withFragment> [namePostfix]

# Using package.json scripts
"scripts": {
  "generate": "gql-gen ./generated ./schema.graphqls true"
}
```

### Parameters

- `outputDir`: Directory where generated files will be saved
- `schemaPath`: Path to schema source, can be:
    - A single `.graphqls` file
    - A directory containing `.graphqls` files
    - A glob pattern (e.g., `**/*.graphqls`)
    - An HTTP/HTTPS endpoint URL
- `withFragment`: `true` or `false` - whether to generate fragment files
- `namePostfix`: (Optional) Suffix to add to generated operation names

### Testing

### Local Testing

The project includes a comprehensive test suite with sample schemas. To run the tests:

```bash
# Run all tests
npm test

# Or run specific tests
npm run test:basic      # Test without fragments
npm run test:fragments  # Test with fragments
npm run test:postfix    # Test with custom postfix
```

### Test Structure

```
examples/
├── sample-schema.graphqls     # Blog application schema
├── ecommerce-schema.graphqls  # E-commerce schema with advanced features
└── multi-schema/              # Multiple schema files for testing
    ├── auth.graphqls         # Authentication extensions
    └── subscription.graphqls # Subscription types

test-output/                   # Generated test outputs
├── basic/                     # Basic generation results
├── fragments/                 # Fragment generation results
├── postfix/                   # Custom postfix results
└── multi-schema/             # Multi-schema merge results
```

### Sample Schemas

1. **Blog Schema** (`examples/sample-schema.graphqls`):
    - User management (CRUD operations)
    - Post management with comments
    - Social features (likes, followers)

2. **E-commerce Schema** (`examples/ecommerce-schema.graphqls`):
    - Product catalog with categories
    - Shopping cart operations
    - Order management
    - Advanced features: unions, interfaces, custom scalars, enums

### Quick Test

For a quick verification that everything is working:

```bash
# Make test scripts executable (first time only)
chmod +x test-local.sh quick-test.js examples/run-example.sh

# Run quick test
node quick-test.js
```

This will create a simple schema, generate files, display the output, and clean up automatically.

### Manual Testing

1. **Run the example script:**
   ```bash
   cd examples
   ./run-example.sh
   ```

2. **Test with sample schema:**
   ```bash
   node generate-graphql-files.cjs ./output examples/sample-schema.graphqls false
   ```

3. **Test with npm link:**
   ```bash
   npm link
   gql-gen ./output examples/sample-schema.graphqls true
   ```

4. **Test with remote endpoint:**
   ```bash
   # Replace with your GraphQL endpoint
   gql-gen ./output https://api.example.com/graphql false
   ```

## Examples

### Generate from a single schema file
```bash
gql-gen ./generated ./schema.graphqls false
```

### Generate from a directory
```bash
gql-gen ./generated ./schemas true
```

### Generate from a glob pattern
```bash
gql-gen ./generated "src/**/*.graphqls" true
```

### Generate from a remote endpoint
```bash
gql-gen ./generated https://api.example.com/graphql false
```

### Generate with custom postfix
```bash
gql-gen ./generated ./schema.graphqls true "V2"
```

### Using in npm scripts
```json
{
  "scripts": {
    "generate:graphql": "gql-gen ./src/graphql ./schemas/*.graphqls true",
    "generate:graphql:prod": "gql-gen ./src/graphql https://api.production.com/graphql false PROD"
  }
}
```

### Programmatic usage with child_process
```javascript
const { exec } = require('child_process');

exec('npx gql-gen ./output ./schema.graphqls true', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log('GraphQL files generated successfully');
});
```

## Output Structure

The tool generates the following files:

### Query/Mutation Files
For each query and mutation field in your schema, a separate GraphQL file is created:

```
generated/
├── GetUser-query.graphql
├── GetUsers-query.graphql
├── CreateUser-mutation.graphql
└── UpdateUser-mutation.graphql
```

### Fragment Files (when `withFragment` is `true`)
For each type in your schema, a fragment file is created:

```
generated/
├── User-fragment.graphql
├── Post-fragment.graphql
└── Comment-fragment.graphql
```

### Downloaded Schema (for remote endpoints)
When using a remote endpoint, the schema is downloaded and saved:

```
generated/
└── schema.graphqls
```

## Generated File Examples

### Query File Example
```graphql
query GetUserV2(
  $id: ID!
) {
  getUser(
    id: $id
  ) {
    id
    name
    email
    posts {
      id
      title
      content
    }
  }
}
```

### Fragment File Example
```graphql
fragment UserV2Fragment on User {
  id
  name
  email
  posts { ...PostV2Fragment }
}
```

## Advanced Features

### Schema Merging
When multiple schema files are provided (via directory or glob pattern), the tool automatically merges them into a single schema before generation. This is useful for modular schema architectures.

### Circular Reference Handling
Set `withFragment` to `false` if your schema contains circular references to avoid infinite loops in generated queries.

### Custom Type Handling
The tool intelligently handles:
- Scalar types
- Enum types
- Input types
- Object types
- List types
- Non-null types

## Requirements

- Node.js >= 18.0.0
- GraphQL schema in SDL format (`.graphqls` files)

## Dependencies

- `graphql`: GraphQL JavaScript implementation
- `globby`: File system pattern matching
- `node-fetch`: HTTP client for downloading remote schemas

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

If you encounter any issues or have questions, please file an issue on the [GitHub repository](https://github.com/tinywind/graphql-recursive-query-gen/issues).

## Important Note

Make sure to add the shebang line `#!/usr/bin/env node` at the beginning of `generate-graphql-files.cjs` file for the CLI to work properly.
