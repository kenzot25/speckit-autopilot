# Architecture

This document describes the architecture and design decisions of Speckit Autopilot.

## Overview

Speckit Autopilot is a Model Context Protocol (MCP) server that provides programmatic tools for automating the Speckit workflow. It bridges the gap between LLM assistants (like Cursor or Claude) and the Speckit specification-driven development process.

## Design Principles

1. **Deterministic Execution**: Rules are enforced in code, not instructions
2. **No Interruptions**: Tools never ask questions, they execute
3. **Type Safety**: Full TypeScript with strict mode
4. **Error Handling**: Clear errors with context
5. **State Management**: Track workflow progress
6. **Validation**: Validate all inputs and outputs

## Architecture Layers

```
┌─────────────────────────────────────┐
│   MCP Client (Cursor/Claude)      │
└──────────────┬──────────────────────┘
               │ MCP Protocol
┌──────────────▼──────────────────────┐
│   MCP Server (index.ts)             │
│   - Tool Registration               │
│   - Request Handling                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Tools Layer                        │
│   - specify.ts                       │
│   - clarify.ts                       │
│   - plan.ts                          │
│   - tasks.ts                         │
│   - implement.ts                     │
│   - review.ts                        │
│   - autopilot.ts                     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Utilities Layer                    │
│   - files.ts (file operations)       │
│   - scripts.ts (bash execution)      │
│   - state.ts (workflow state)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   External Systems                   │
│   - Git (branch management)         │
│   - File System (specs, plans)      │
│   - Bash Scripts (.specify/scripts) │
└─────────────────────────────────────┘
```

## Component Details

### MCP Server (`index.ts`)

The entry point that:
- Initializes the MCP server
- Registers all tools
- Handles tool calls
- Manages server lifecycle

### Tools

Each tool follows a consistent pattern:

1. **Input Validation**: Validate all parameters
2. **Path Resolution**: Get and validate paths
3. **Path Normalization**: Convert to absolute paths
4. **Execution**: Perform the tool's operation
5. **State Update**: Update workflow state
6. **Result Return**: Return structured result

#### Tool Types

- **Specification Tools**: `specify`, `clarify`
- **Planning Tools**: `plan`, `tasks`
- **Execution Tools**: `implement`, `review`
- **Orchestration**: `autopilot`

### Utilities

#### `files.ts`

File operations:
- Read/write files
- Check file existence
- Parse markdown (tasks.md)
- Task management

#### `scripts.ts`

Script execution:
- Execute bash scripts
- Parse JSON output
- Get repository root
- Get feature paths

#### `state.ts`

Workflow state:
- Track current step
- Store step status
- Persist state to JSON
- Resume workflows

## Data Flow

### Autopilot Workflow

```
User Input (feature description)
    ↓
speckit_autopilot()
    ↓
speckit_specify() → Create spec.md
    ↓
speckit_clarify() → Generate questions (optional)
    ↓
speckit_plan() → Create plan.md
    ↓
speckit_tasks() → Create tasks.md
    ↓
speckit_implement() → Return task list
    ↓
LLM executes tasks (using other tools)
    ↓
speckit_review() → Check code quality (optional)
    ↓
Result
```

### State Management

State is stored in `.speckit-workflow-state.json`:

```json
{
  "featureDir": "specs/001-feature",
  "currentStep": "implement",
  "stepStatus": {
    "specify": { "completed": true },
    "plan": { "completed": true },
    "tasks": { "completed": true }
  },
  "metadata": {
    "startedAt": "2024-01-01T00:00:00Z",
    "featureDescription": "..."
  }
}
```

## Error Handling

### Error Types

1. **Validation Errors**: Invalid input parameters
2. **Path Errors**: Missing or invalid paths
3. **Script Errors**: Script execution failures
4. **File Errors**: File read/write failures

### Error Response Format

```typescript
{
  success: false,
  error: "Error message with context",
  // Tool-specific error details
}
```

## Security Considerations

### Path Validation

- All paths are normalized to absolute paths
- Prevents directory traversal attacks
- Validates paths exist before use

### Script Execution

- Scripts executed with limited permissions
- Output validated before parsing
- Errors caught and handled

### Input Validation

- All inputs validated and sanitized
- Type checking with TypeScript
- Clear error messages

## Testing Strategy

### Unit Tests

- Test individual functions
- Mock external dependencies
- Test error cases

### Integration Tests

- Test full workflows
- Test tool interactions
- Test state management

## Performance Considerations

- Script execution has timeouts
- File operations are async
- State is cached in memory
- Minimal file I/O operations

## Future Improvements

1. **Caching**: Cache script results
2. **Parallel Execution**: Execute independent tasks in parallel
3. **Progress Reporting**: Real-time progress updates
4. **Resume Capability**: Better workflow resumption
5. **Validation**: More comprehensive input validation

## Dependencies

### Runtime

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- Node.js built-ins: `fs`, `path`, `child_process`

### Development

- `typescript`: Type checking and compilation
- `jest`: Testing framework
- `ts-jest`: TypeScript support for Jest

## License

MIT License - see [LICENSE](LICENSE) file.
