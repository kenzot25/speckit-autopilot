# Development Guide

This guide is for contributors who want to develop or modify Speckit Autopilot.

## Project Structure

```
speckit-autopilot/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/                # MCP tools (autopilot, specify, clarify, etc.)
│   └── utils/                # Utilities (files, scripts, state)
├── src/__tests__/           # Unit tests
└── dist/                    # Compiled output
```

## Development Commands

```bash
npm run build        # Build TypeScript
npm run dev          # Watch mode
npm test             # Run tests
npm run test:watch   # Watch tests
npm run test:coverage # Coverage report
```

## Building

```bash
# Build TypeScript
npm run build

# Watch mode
npm run dev

# Run server directly
npm start
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Code Quality

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint (recommended)
- **Testing**: Jest with comprehensive coverage
- **Validation**: All inputs validated, paths normalized

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

## Architecture

The MCP server provides tools that:

1. **Execute existing bash scripts** (`.specify/scripts/bash/*.sh`)
2. **Read/write files** (spec.md, plan.md, tasks.md)
3. **Track workflow state** (`.speckit-workflow-state.json`)
4. **Enforce rules programmatically** (no interruptions, deterministic execution)

### Workflow State

State is tracked in `.speckit-workflow-state.json`:

```json
{
  "featureDir": "specs/001-feature-name",
  "currentStep": "implement",
  "stepStatus": {
    "specify": { "completed": true, "branchName": "001-feature-name" },
    "plan": { "completed": true, "planPath": "..." },
    "tasks": { "completed": true, "taskCount": 10 }
  },
  "metadata": {
    "startedAt": "2024-01-01T00:00:00Z",
    "featureDescription": "..."
  }
}
```

## Benefits Over Markdown Commands

- ✅ **No LLM interpretation**: Rules are in code, not instructions
- ✅ **Deterministic**: Same input always produces same output
- ✅ **Testable**: Can unit test tool implementations
- ✅ **Debuggable**: Clear execution flow, structured logging
- ✅ **No interruptions**: `speckit_implement` enforces "no questions" rule programmatically
- ✅ **Type safe**: TypeScript ensures type safety

## Related Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [TESTING.md](TESTING.md) - Testing documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture details
- [CLI.md](CLI.md) - CLI tool documentation
