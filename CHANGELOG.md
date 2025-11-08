# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2025-11-08

### Fixed
- Fixed path resolution to use `process.cwd()` instead of `__dirname` for correct working directory behavior
- Added automatic detection and handling of absolute vs relative paths for both output and schema paths
- Improved Windows path compatibility by normalizing backslashes to forward slashes for globby
- Fixed TypeError when processing schema definitions without name property (schema blocks, directives)
- Removed path.posix dependency for better cross-platform compatibility

### Improved
- Enhanced cross-platform path handling for Windows and Unix-like systems
- Better error messages for path-related issues

## [1.0.3] - 2025-08-24

### Added
- Configurable `maxDepth` parameter to control query nesting depth (default: 5)
- CLI argument support for maxDepth as 6th parameter

### Improved
- Enhanced empty object body prevention logic
- Better handling of deeply nested GraphQL types
- Optimized recursive query generation with depth limiting

### Fixed
- Prevent generation of empty object bodies in GraphQL queries
- Improved circular reference detection with path-based tracking

## [1.0.0] - 2025-07-15

### Added
- Initial release
- Generate GraphQL query and mutation files from schemas
- Support for local files, directories, and glob patterns
- Support for remote GraphQL endpoints
- Fragment generation option
- Custom naming with postfix support
- Schema merging for multiple files
- Comprehensive test suite and examples

### Features
- Automatic type detection and query structure generation
- Handles complex GraphQL types (unions, interfaces, enums)
- Circular reference prevention with fragment option
- Variable definitions and field arguments support
- Nested object field expansion
- Clean, formatted output files
