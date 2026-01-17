# Testing Guide

This project includes comprehensive test suites that verify the build output and all functions work correctly.

## Test Structure

### 1. Build Verification Tests (`src/__tests__/build.test.ts`)
- Verifies the project builds successfully
- Checks that all expected output files are generated in `dist/`
- Validates JavaScript syntax in compiled output
- Ensures no CommonJS `require()` calls exist (ES modules only)

### 2. Integration Tests (`src/__tests__/integration/build-output.test.ts`)
- Tests that all modules can be imported from `dist/` after build
- Verifies all exported functions are available and callable
- Ensures build output is functional

### 3. Unit Tests

#### Utilities (`src/__tests__/utils/`)
- **scripts.test.ts**: Tests script execution and JSON parsing utilities
- **files.test.ts**: Tests file operations (read, write, exists, task parsing)
- **state.test.ts**: Tests workflow state management

#### Tools (`src/__tests__/tools/`)
- **all-tools.test.ts**: Integration tests for all tool functions:
  - `speckitSpecify` - Feature specification creation
  - `speckitClarify` - Clarification question generation
  - `speckitPlan` - Implementation plan creation
  - `speckitTasks` - Task list generation
  - `speckitImplement` - Implementation status reporting
  - `markTaskAsComplete` - Task completion tracking
  - `speckitReview` - Code review functionality
  - `speckitAutopilot` - Full workflow automation

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with build verification
```bash
npm run test:build
```

This command:
1. Builds the project (`npm run build`)
2. Runs all tests (`npm test`)

### Run specific test file
```bash
npm test -- src/__tests__/build.test.ts
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Coverage

The test suite covers:

✅ **Build Process**
- TypeScript compilation
- Output file generation
- ES module syntax validation

✅ **All Tool Functions**
- Feature specification creation
- Clarification workflow
- Planning workflow
- Task generation
- Implementation tracking
- Code review
- Full autopilot workflow

✅ **All Utility Functions**
- Script execution (`executeScript`, `executeScriptJSON`)
- JSON parsing (`parseJSONFromOutput`)
- Repository root detection (`getRepoRoot`)
- Feature path resolution (`getFeaturePaths`)
- File operations (`readFile`, `writeFile`, `fileExists`)
- Task parsing (`parseTasksMd`, `markTaskComplete`, `getIncompleteTasks`)
- Workflow state management (`initWorkflowState`, `getWorkflowState`, `setWorkflowState`, `updateWorkflowState`)

## Test Requirements

- Node.js 20+ (for ES modules support)
- Git repository (for some integration tests)
- Temporary directory write permissions

## Continuous Integration

The test suite is designed to run in CI/CD pipelines:

1. **Build Step**: `npm run build` - Compiles TypeScript
2. **Test Step**: `npm test` - Runs all tests
3. **Coverage Step**: `npm run test:coverage` - Generates coverage reports

## Troubleshooting

### Tests fail with "dist directory does not exist"
Run `npm run build` first, or use `npm run test:build` which builds automatically.

### Tests fail with git errors
Some tests require a git repository. Ensure you're running tests from within a git repository, or mock git commands in test setup.

### Import errors in integration tests
Ensure the project is built (`npm run build`) before running integration tests that import from `dist/`.
