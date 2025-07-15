#!/usr/bin/env node
async function main() {
  const fs = require('fs');
  const { parse } = require('graphql');
  const globby = require('globby');
  const path = require('path');
  const { join } = require('path').posix;
  const fetch = (await import('node-fetch')).default;

  const downloadSchema = endpoint => {
    const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        ...FullType
      }
      directives {
        name
        description
        locations
        args {
          ...InputValue
        }
      }
    }
  }

  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args {
        ...InputValue
      }
      type {
        ...TypeRef
      }
      isDeprecated
      deprecationReason
    }
    inputFields {
      ...InputValue
    }
    interfaces {
      ...TypeRef
    }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes {
      ...TypeRef
    }
  }

  fragment InputValue on __InputValue {
    name
    description
    type { ...TypeRef }
    defaultValue
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
        }
      }
    }
  }
`;
    try {
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: introspectionQuery }),
      })
        .then(response => {
          if (!response.ok) throw new Error(`Error fetching schema: ${response.statusText}`);
          return response.json();
        })
        .then(result => {
          const schemaSDL = require('graphql/utilities').printSchema(require('graphql/utilities/buildClientSchema').buildClientSchema(result.data));
          const outFile = path.join(outputDir, 'schema.graphqls');
          fs.writeFileSync(outFile, schemaSDL); // note: 고정 파일명 `schema.graphqls`
          console.log(`Schema downloaded and saved to "${outputDir}/schema.graphqls"`);
          return outFile;
        });
    } catch (error) {
      console.error('Failed to download schema:', error);
    }
  };

  const generateFieldFragment = fields => {
    if (!fields) return '';

    return fields
      .map(field => {
        const fieldName = field.name.value;
        const subFields = generateFieldFragment(field.selectionSet && field.selectionSet.selections);
        return `${intent}${intent}${fieldName}${subFields ? ` {\n${subFields}\n${intent}${intent}}` : ''}`;
      })
      .join('\n');
  };

  const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
  const argType = type => {
    if (type?.name?.value) return `${type.name.value}${type.loc.endToken.kind === '!' ? '!' : ''}`;
    if (type.kind === 'ListType') return `[${argType(type.type)}]`;
    if (type.kind === 'NonNullType') return `${argType(type.type)}!`;
    return `${argType(type.type)}`;
  };
  const variableDefinitions = field => field.arguments.map(arg => `${intent}$${arg.name.value}: ${argType(arg.type)}`).join('\n');
  const fieldArgs = field => field.arguments.map(arg => `${intent}${intent}${arg.name.value}: $${arg.name.value}`).join('\n');

  const findObjectType = type => {
    if (type?.name?.value) return type.name.value;
    if (type.kind === 'ListType') return findObjectType(type.type);
    if (type.kind === 'NonNullType') return findObjectType(type.type);
    return findObjectType(type.type);
  };

  const repeatedIntent = count => {
    let result = '';
    for (let i = 0; i < count; i++) result += intent;
    return result;
  };

  const getReturnTypes = (TYPES, typeRef, paths) => {
    const objectType = TYPES[typeRef];
    const intents = repeatedIntent(paths.length + 2);
    if (objectType) {
      return objectType
        .map(field => {
          if (paths.find(path => path.name === field.name && path.ref === field.ref)) return '';
          return `${intents}${field.name}` + (TYPES[field.ref] ? ` {\n${getReturnTypes(TYPES, field.ref, [...paths, { name: field.name, ref: field.ref }])}${intents}\n${intents}}` : '');
        })
        .join('\n');
    }
    return '';
  };

  const generateGraphQLFile = schema => {
    const types = {};
    const definitions = parse(schema).definitions;

    definitions
      .filter(def => !['Query', 'Mutation'].includes(def.name.value) && !['ScalarTypeDefinition', 'EnumTypeDefinition', 'InputObjectTypeDefinition'].includes(def.kind))
      .forEach(def => {
        const fields = [];
        for (let i in def.fields) {
          const field = def.fields[i];
          fields.push({ name: field.name.value, type: argType(field.type), ref: findObjectType(field.type) });
        }
        types[def.name.value] = fields;
      });

    if (withFragment) {
      for (let key in types) {
        const content = `fragment ${key}${namePostfix}Fragment on ${key} {\n${types[key]
          .map(field => `${intent}${field.name}${types[field.ref] ? ` { ...${field.ref}${namePostfix}Fragment }` : ''}\n`)
          .join('')}}`;
        fs.writeFileSync(`${outputDir}/${key}-fragment.graphql`, content, 'utf-8');
      }
    }

    definitions
      .filter(def => ['Query', 'Mutation'].includes(def.name.value))
      .forEach(def => {
        def.fields.map(field => {
          const operationName = def.name.value;
          const fieldName = field.name.value;
          const content = `${operationName.toLowerCase()} ${capitalize(fieldName)}${namePostfix}${
            field.arguments && field.arguments.length ? `(\n${variableDefinitions(field)}\n)` : ''
          } {\n${intent}${fieldName}${field.arguments && field.arguments.length ? `(\n${fieldArgs(field)}\n${intent})` : ''} ${
            !types[findObjectType(field.type)]
              ? ''
              : withFragment
                ? `{ ...${findObjectType(field.type)}${namePostfix}Fragment }`
                : `{\n${getReturnTypes(types, findObjectType(field.type), [])}\n${intent}}`
          }\n}\n`;
          fs.writeFileSync(`${outputDir}/${capitalize(fieldName)}-${operationName.toLowerCase()}.graphql`, content, 'utf-8');
        });
      });
  };

  const mergeSchemas = (schemas) => {
    // Merge multiple schema strings into one
    const mergedDefinitions = [];
    const seenTypes = new Set();
    const seenOperations = new Map(); // Track Query/Mutation fields
    
    schemas.forEach(schema => {
      try {
        const parsed = parse(schema);
        parsed.definitions.forEach(def => {
          if (def.kind === 'ObjectTypeDefinition' || def.kind === 'ObjectTypeExtension') {
            if (['Query', 'Mutation', 'Subscription'].includes(def.name.value)) {
              // For Query/Mutation/Subscription, merge fields
              if (!seenOperations.has(def.name.value)) {
                seenOperations.set(def.name.value, {
                  kind: 'ObjectTypeDefinition',
                  name: def.name,
                  fields: [],
                  directives: def.directives || [],
                  interfaces: def.interfaces || [],
                  loc: def.loc
                });
              }
              const existing = seenOperations.get(def.name.value);
              if (def.fields) {
                existing.fields.push(...def.fields);
              }
            } else {
              // For other types, avoid duplicates
              if (!seenTypes.has(def.name.value)) {
                seenTypes.add(def.name.value);
                mergedDefinitions.push(def);
              }
            }
          } else {
            // For other definition types (enum, scalar, input, etc.), avoid duplicates
            const typeName = def.name?.value;
            if (typeName && !seenTypes.has(typeName)) {
              seenTypes.add(typeName);
              mergedDefinitions.push(def);
            } else if (!typeName) {
              // Schema definition, directive definition, etc.
              mergedDefinitions.push(def);
            }
          }
        });
      } catch (error) {
        console.error(`Error parsing schema: ${error.message}`);
      }
    });
    
    // Add merged Query/Mutation/Subscription types
    seenOperations.forEach(def => {
      mergedDefinitions.push(def);
    });
    
    return {
      kind: 'Document',
      definitions: mergedDefinitions
    };
  };

  const generate = async (absoluteSchemaPathPattern) => {
    try {
      let schemaPaths = [];
      
      // Check if it's a glob pattern (contains * or ?)
      if (absoluteSchemaPathPattern.includes('*') || absoluteSchemaPathPattern.includes('?')) {
        // Treat as glob pattern
        schemaPaths = await globby(absoluteSchemaPathPattern);
      } else {
        // Check if it's a file or directory
        try {
          const stat = fs.statSync(absoluteSchemaPathPattern);
          if (stat.isDirectory()) {
            // If it's a directory, find all .graphqls files in it
            schemaPaths = await globby(join(absoluteSchemaPathPattern, '**/*.graphqls'));
          } else if (stat.isFile() && absoluteSchemaPathPattern.endsWith('.graphqls')) {
            // If it's a single file
            schemaPaths = [absoluteSchemaPathPattern];
          }
        } catch (error) {
          console.error(`Path not found: ${absoluteSchemaPathPattern}`);
          return;
        }
      }
      
      if (schemaPaths.length === 0) {
        console.error('No GraphQL schema files found');
        return;
      }
      
      console.log(`Found ${schemaPaths.length} schema file(s):`);
      schemaPaths.forEach(p => console.log(`  - ${p}`));
      
      // Read all schema files
      const schemas = schemaPaths.map(schemaPath => {
        console.log(`Reading schema from: ${schemaPath}`);
        return fs.readFileSync(schemaPath, 'utf-8');
      });
      
      // Merge schemas
      const mergedDocument = mergeSchemas(schemas);
      
      // Print merged schema for debugging
      const { print } = require('graphql');
      const mergedSchema = print(mergedDocument);
      
      // Generate GraphQL files from merged schema
      generateGraphQLFile(mergedSchema);
      
      console.log('GraphQL files generated successfully!');
    } catch (error) {
      console.error('Error in generate function:', error);
    }
  };

  if (process.argv.length < 4) {
    console.error('Usage: node generate-graphql-files.cjs <outputDir> <schemaPathPattern> <withFragment:[true|false]> <namePostfix(optional)>');
    console.error('  schemaPathPattern can be:');
    console.error('    - A single .graphqls file path');
    console.error('    - A directory containing .graphqls files');
    console.error('    - A glob pattern (e.g., "**/*.graphqls")');
    console.error('    - An HTTP/HTTPS endpoint URL');
    process.exit(1);
  }

  const outputDir = process.argv[2];
  const schemaPath = process.argv[3];
  const withFragment = process.argv[4] === 'true'; // note: 순한 참조가 있다면, `false`로 설정해야 함
  const namePostfix = process.argv[5] || '';
  const intent = '  ';

  try {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('Directory created successfully:', outputDir);
  } catch (error) {
    console.error('Error creating directory:', error);
  }

  if (schemaPath.startsWith('https://') || schemaPath.startsWith('http://')) {
    downloadSchema(schemaPath).then(async schemaFile => {
      schemaFile = join(path.resolve(__dirname, schemaFile).split(path.sep).join('/'));
      await generate(schemaFile);
    });
  } else {
    await generate(join(path.resolve(__dirname, schemaPath).split(path.sep).join('/')));
  }
}
main().catch(error => console.error('An error occurred:', error));
