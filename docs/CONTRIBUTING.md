# Contributing to Speckit Autopilot

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Git
- Basic knowledge of TypeScript and MCP

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/kenzot25/speckit-autopilot.git
   cd speckit-autopilot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build**
   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make Your Changes**
   - Write code following existing patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm test
   npm run build
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `test:` for tests
   - `refactor:` for refactoring
   - `chore:` for maintenance

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style

### TypeScript

- Use strict TypeScript settings
- Prefer explicit types over `any`
- Use async/await for promises
- Handle errors explicitly

### File Organization

- One function/class per file when possible
- Group related utilities together
- Keep files focused and small

### Naming Conventions

- Functions: `camelCase`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `snake_case.ts` for utilities, `PascalCase.ts` for classes

### Example

```typescript
// Good
export async function speckitSpecify(
  featureDescription: string
): Promise<SpecifyResult> {
  if (!featureDescription?.trim()) {
    throw new Error('Feature description is required');
  }
  // ...
}

// Bad
export async function specify(desc: any): Promise<any> {
  // No validation, any types
}
```

## Testing

### Writing Tests

- Write tests for all new functionality
- Test both success and error cases
- Test edge cases (undefined, null, empty strings)
- Aim for high coverage

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('functionName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should handle valid input', async () => {
    // Test implementation
    expect(result).toBeDefined();
  });

  it('should throw error for invalid input', async () => {
    await expect(functionName(undefined)).rejects.toThrow();
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Documentation

### Updating Documentation

- Update README.md for user-facing changes
- Update code comments for complex logic
- Add examples for new features
- Update [CHANGELOG.md](CHANGELOG.md) for releases

### Documentation Style

- Use clear, concise language
- Include code examples
- Explain "why" not just "what"
- Keep examples up-to-date

## Pull Request Process

### Before Submitting

1. ✅ All tests pass
2. ✅ Code builds without errors
3. ✅ Documentation updated
4. ✅ No console.logs or debug code
5. ✅ Follows code style guidelines

### PR Description

Include:
- What changes were made
- Why the changes were needed
- How to test the changes
- Any breaking changes

### Review Process

- Maintainers will review your PR
- Address feedback promptly
- Be open to suggestions
- Keep PRs focused and small

## Adding New Tools

### Tool Structure

```typescript
import { getFeaturePaths } from '../utils/scripts.js';
import { readFile, writeFile } from '../utils/files.js';

export interface ToolResult {
  success: boolean;
  // ... other fields
}

export async function speckitTool(
  featureDir: string,
  options?: ToolOptions
): Promise<ToolResult> {
  // 1. Validate inputs
  if (!featureDir) {
    throw new Error('Feature directory is required');
  }

  // 2. Get paths
  const paths = await getFeaturePaths();
  if (!paths || !paths.REQUIRED_FIELD) {
    throw new Error(`Invalid paths: ${JSON.stringify(paths)}`);
  }

  // 3. Normalize paths
  const absolutePath = path.isAbsolute(paths.PATH)
    ? paths.PATH
    : path.join(repoRoot, paths.PATH);

  // 4. Execute logic
  // ...

  // 5. Return result
  return {
    success: true,
    // ...
  };
}
```

### Registering Tools

Add to `src/index.ts`:

```typescript
case 'speckit_tool':
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(
        await speckitTool(args.featureDir as string),
        null,
        2
      ),
    }],
  };
```

## Reporting Issues

### Bug Reports

Include:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (Node version, OS, etc.)
- Error messages/logs

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternatives considered
- Additional context

## Questions?

- Open a GitHub issue
- Start a discussion
- Check existing documentation

Thank you for contributing! 🎉
