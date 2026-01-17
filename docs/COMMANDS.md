# Speckit Commands Provided by MCP Server

This MCP server extends standard Speckit by providing two new commands that don't exist in the base Speckit framework:

## `/speckit.autopilot`

**NEW** - Complete workflow automation command.

### What It Does

Automates the entire Speckit workflow from feature description to implementation:

1. **Specify** - Creates feature specification
2. **Clarify** - Asks clarifying questions (optional)
3. **Plan** - Creates technical implementation plan
4. **Tasks** - Generates actionable task list
5. **Implement** - Executes all tasks automatically (no interruptions)
6. **Review** - Reviews code quality and fixes issues (optional)

### Usage

```
/speckit.autopilot Add user authentication with email and password
```

### Key Features

- ✅ **No Interruptions**: Executes all steps automatically without asking questions
- ✅ **Deterministic**: Uses MCP server tools for consistent execution
- ✅ **Complete**: Finishes everything in one pass
- ✅ **State Tracking**: Can resume if interrupted

### How It Works

The command uses MCP server tools:
- `speckit_specify` - Create spec
- `speckit_clarify` - Clarify spec
- `speckit_plan` - Create plan
- `speckit_tasks` - Generate tasks
- `speckit_implement` - Get task list
- `speckit_review` - Review code

## `/speckit.review`

**NEW** - Comprehensive code review command.

### What It Does

Performs iterative code review checking:

- **Build/Compile Issues**: TypeScript, Dart errors
- **Best Practices**: Latest documentation compliance
- **Code Quality**: Clean, maintainable, scalable code
- **Code Organization**: Proper file splitting, length
- **Type Safety**: All type issues resolved
- **Architecture Compliance**: Project conventions

### Usage

```
/speckit.review
```

### Key Features

- ✅ **Iterative**: Fixes issues and re-checks until clean
- ✅ **Comprehensive**: Checks build, quality, and architecture
- ✅ **Automatic**: Fixes issues automatically
- ✅ **Smart**: Prioritizes CRITICAL and HIGH issues

### How It Works

1. Checks build/compile status
2. Reviews code quality
3. Fixes issues automatically
4. Re-runs checks
5. Iterates until all CRITICAL and HIGH issues are resolved

## Installation

### Automatic Installation

When you run `./setup-mcp.sh`, the commands are automatically installed from templates:
```bash
cd speckit-autopilot
./setup-mcp.sh  # Installs MCP server config AND commands
```

### Manual Installation

To install commands separately:
```bash
./install-commands.sh
```

This copies templates from `templates/commands/` to your project's `.cursor/commands/` directory.

### For Other Projects

1. **Option 1**: Copy templates from MCP server:
   ```bash
   cp speckit-autopilot/templates/commands/*.md /path/to/other/project/.cursor/commands/
   ```

2. **Option 2**: Copy installed commands:
   ```bash
   cp .cursor/commands/speckit.autopilot.md /path/to/other/project/.cursor/commands/
   cp .cursor/commands/speckit.review.md /path/to/other/project/.cursor/commands/
   ```

3. Configure MCP server in the other project (see README.md)

4. Use the commands in Cursor

**Note**: The templates are included in the MCP server repository, so users can install them automatically.

## Requirements

- Cursor IDE (or compatible IDE with command support)
- MCP server configured (run `./setup-mcp.sh`)
- Speckit setup (`.specify/` directory)

## Differences from Standard Speckit

Standard Speckit provides:
- `/speckit.specify`
- `/speckit.clarify`
- `/speckit.plan`
- `/speckit.tasks`
- `/speckit.implement`

This MCP server adds:
- `/speckit.autopilot` - **NEW** - Full workflow automation
- `/speckit.review` - **NEW** - Comprehensive code review

## Benefits

- **Automation**: Complete workflow in one command
- **No Interruptions**: Executes automatically without questions
- **Quality**: Built-in code review and fixes
- **Consistency**: Uses MCP tools for deterministic execution
