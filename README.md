# graphql-recursive-query-gen

Generate recursive GraphQL query, mutation, and subscription files from local schema files, directories, glob patterns, or remote endpoints.

## Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
- [Output structure](#output-structure)
- [Generated file examples](#generated-file-examples)
- [Advanced features](#advanced-features)
- [Requirements](#requirements)
- [Dependencies](#dependencies)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Features

- Generate query/mutation/subscription files from GraphQL schemas
- Subscription type support
- Support for multiple schema files (merge schemas)
- Download schemas from remote GraphQL endpoints
- Fragment generation support
- Glob pattern support for schema discovery
- Customizable naming with postfix option

## Installation

### Global installation

```bash
npm install -g graphql-recursive-query-gen
```

### Local installation

```bash
npm install graphql-recursive-query-gen
```

### Using npx (without installation)

```bash
npx graphql-recursive-query-gen <outputDir> <schemaPath> <withFragment> [namePostfix] [maxDepth]
```

## Usage

### Basic command

```bash
# With global installation
gql-gen <outputDir> <schemaPath> <withFragment> [namePostfix] [maxDepth]

# With local installation
npx gql-gen <outputDir> <schemaPath> <withFragment> [namePostfix] [maxDepth]

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
- `maxDepth`: (Optional) Maximum nesting depth for query generation (default: 5)

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

### Generate with custom depth limit
```bash
gql-gen ./generated ./schema.graphqls false "" 3
```

### Using in npm scripts
```json
{
  "scripts": {
    "generate:graphql": "gql-gen ./src/graphql \"./schemas/*.graphqls\" true",
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

## Output structure

The tool generates the following files:

### Query, mutation, and subscription files
For each query, mutation, and subscription field in your schema, a separate GraphQL file is created:

```
generated/
├── GetUser-query.graphql
├── GetUsers-query.graphql
├── CreateUser-mutation.graphql
├── UpdateUser-mutation.graphql
├── PostCreated-subscription.graphql
└── CommentAdded-subscription.graphql
```

### Fragment files (when `withFragment` is `true`)
For each type in your schema, a fragment file is created:

```
generated/
├── User-fragment.graphql
├── Post-fragment.graphql
└── Comment-fragment.graphql
```

### Downloaded schema (for remote endpoints)
When using a remote endpoint, the schema is downloaded and saved:

```
generated/
└── schema.graphqls
```

## Generated file examples

### Query file example
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

### Fragment file example
```graphql
fragment UserV2Fragment on User {
  id
  name
  email
  posts { ...PostV2Fragment }
}
```

### Subscription file example
```graphql
subscription PostCreated(
  $userId: ID
) {
  postCreated(
    userId: $userId
  ) {
    id
    title
    content
    author {
      id
      username
    }
  }
}
```

## Advanced features

### Schema merging
When multiple schema files are provided (via directory or glob pattern), the tool automatically merges them into a single schema before generation. This is useful for modular schema architectures.

### Circular reference handling
For schemas with circular references, set `withFragment` to `false`. Fragment mode writes references between fragment files and can produce cyclic fragment spreads that GraphQL rejects.

### Depth control
The `maxDepth` parameter limits nested selections when `withFragment` is `false`. It defaults to 5. The generator omits nested object fields when no selection remains at that depth. Fragment mode does not use this limit.

### Custom type handling
Supported field and argument types:
- Scalar types
- Enum types
- Input types
- Object types
- List types
- Non-null types

## Requirements

- Node.js 22.x or >= 24.0.0
- GraphQL schema in SDL format (`.graphqls` files)

## Dependencies

- `graphql`: GraphQL JavaScript implementation
- `globby`: File system pattern matching
- `node-fetch`: HTTP client for downloading remote schemas

## Testing

### Local testing

From a source checkout, install dependencies and run the sample-schema checks:

```bash
npm install

# Run all checks
npm test

# Or run specific tests
npm run test:basic      # Test without fragments
npm run test:fragments  # Test with fragments
npm run test:postfix    # Test with custom postfix
```

### Test structure

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

### Sample schemas

1. **Blog Schema** (`examples/sample-schema.graphqls`):
    - User management (CRUD operations)
    - Post management with comments
    - Social features (likes, followers)
    - Real-time subscriptions (post created, comment added)

2. **E-commerce Schema** (`examples/ecommerce-schema.graphqls`):
    - Product catalog with categories
    - Shopping cart operations
    - Order management
    - Advanced features: unions, interfaces, custom scalars, enums

### Quick test

Run the quick check:

```bash
# Run quick test
node quick-test.js
```

This will create a simple schema, generate files, display the output, and clean up automatically.

### Manual testing

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

## Contributing

Open an issue to report a problem or propose a change, or submit a pull request.

## License

MIT

## Support

Report problems or ask questions in [GitHub issues](https://github.com/tinywind/graphql-recursive-query-gen/issues).
