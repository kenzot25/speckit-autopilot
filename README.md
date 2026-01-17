# Speckit Autopilot

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](https://github.com/kenzot25/speckit-autopilot)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for automating the [Speckit](https://github.com/github/speckit) workflow with deterministic execution and no interruptions.

## Features

- 🚀 **Deterministic Execution** - Rules enforced in code, not instructions
- ⚡ **No Interruptions** - Executes without asking questions
- 📊 **State Tracking** - Resume workflows if interrupted
- 🔄 **Full Automation** - Specify → Clarify → Plan → Tasks → Implement → Review
- ✅ **Type Safe** - TypeScript with comprehensive type checking
- 🌍 **Cross-Platform** - macOS, Windows, Linux
- 🔧 **Multi-Tech Stack** - Flutter, TypeScript, Python, Go, Rust, Java, and more

## Quick Start

```bash
# Install
curl -fsSL "https://raw.githubusercontent.com/kenzot25/speckit-autopilot/master/install.sh?$(date +%s)" | sh

# Setup in your project
cd /path/to/your/project
speckit-autopilot setup

# Restart Cursor and use /speckit.autopilot commands!
```

## Installation

### Prerequisites

- Node.js 20+
- Git repository with Speckit setup (`.specify/` directory)

### Quick Install (Recommended)

```bash
curl -fsSL "https://raw.githubusercontent.com/kenzot25/speckit-autopilot/master/install.sh?$(date +%s)" | sh
```

**Options:**
```bash
# Global install
curl -fsSL "..." | sh -s -- --global

# Custom directory
curl -fsSL "..." | sh -s -- --dir ~/my-custom-path

# Skip MCP setup
curl -fsSL "..." | sh -s -- --skip-setup
```

### Manual Installation

```bash
git clone <repo>
cd speckit-autopilot
npm install
npm run build
npm install -g .  # Optional: global install
```

**Then in your project:**
```bash
cd /path/to/your/project
speckit-autopilot setup
```

## Setup

Run setup in each project directory where you want to use Speckit Autopilot:

```bash
speckit-autopilot setup              # Full setup (MCP + commands)
speckit-autopilot install-commands   # Commands only
speckit-autopilot verify              # Verify installation
speckit-autopilot help                # Show help
```

**Important:** The MCP server runs automatically. Cursor manages it as a subprocess. Just restart Cursor after setup.

## Commands

### `/speckit.autopilot`

Complete workflow automation from feature description to implementation.

```
/speckit.autopilot Add user authentication with email and password
```

Runs: specify → clarify → plan → tasks → implement → review (all automatically)

### `/speckit.review`

Comprehensive code review that checks build issues and fixes them iteratively.

```
/speckit.review
```

Checks build/compile errors, reviews code quality, and fixes issues automatically.

## MCP Tools

### `speckit_autopilot`

Execute complete workflow automatically:

```json
{
  "featureDescription": "Add user authentication",
  "skipClarify": false,
  "skipReview": false
}
```

### Individual Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `speckit_specify` | Create feature specification | `featureDescription` |
| `speckit_clarify` | Generate clarification questions | `featureDir`, `maxQuestions` |
| `speckit_plan` | Create implementation plan | `featureDir` |
| `speckit_tasks` | Generate task list | `featureDir` |
| `speckit_implement` | Get implementation tasks | `featureDir`, `autoContinue` |
| `speckit_review` | Review code quality | `featureDir`, `maxIterations` |
| `speckit_mark_task_complete` | Mark task complete | `featureDir`, `taskId` |

See [docs/COMMANDS.md](docs/COMMANDS.md) for detailed documentation.

## Usage Examples

### Full Autopilot Workflow

```typescript
speckit_autopilot({
  featureDescription: "Add user authentication with email and password",
  skipClarify: false,
  skipReview: false
})
```

### Step-by-Step

```typescript
const spec = await speckit_specify("Add dark mode toggle");
const questions = await speckit_clarify(spec.featureDir);
const plan = await speckit_plan(spec.featureDir);
const tasks = await speckit_tasks(spec.featureDir);
const implement = await speckit_implement(spec.featureDir);
const review = await speckit_review(spec.featureDir);
```

## Configuration

The CLI automatically configures `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "speckit": {
      "command": "node",
      "args": ["/absolute/path/to/speckit-autopilot/dist/index.js"]
    }
  }
}
```

**Use absolute paths, not relative paths.**

## Multi-Tech Stack Support

Automatically detects and supports:

- **Flutter/Dart** - `pubspec.yaml` → `flutter analyze`
- **TypeScript/Node.js** - `tsconfig.json` → `tsc --noEmit`
- **Python** - `requirements.txt` → `mypy`
- **Go** - `go.mod` → `go vet`
- **Rust** - `Cargo.toml` → `cargo clippy`
- **Java** - `pom.xml` or `build.gradle`

## FAQ

### Do I need to run the MCP server manually?

**No!** Cursor automatically starts and manages the server. After setup, just restart Cursor.

### How does it work?

Cursor reads `.cursor/mcp.json` and starts the server process automatically when you use MCP tools. The server communicates via stdio.

### Can I run it standalone?

Yes (`node dist/index.js`), but it's designed to run as a Cursor subprocess.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Server not showing up | Check JSON syntax, verify absolute path, restart Cursor |
| Script errors | Check scripts are executable: `chmod +x .specify/scripts/bash/*.sh` |
| Path issues | All paths normalized to absolute; check error messages |

## Contributing

Want to contribute? See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for guidelines.

## Documentation

**User Documentation:**
- [docs/CLI.md](docs/CLI.md) - Detailed CLI documentation
- [docs/COMMANDS.md](docs/COMMANDS.md) - Command reference
- [docs/CHANGELOG.md](docs/CHANGELOG.md) - Version history

**For Contributors:**
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) - Contribution guidelines
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - Development guide
- [docs/TESTING.md](docs/TESTING.md) - Testing documentation
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture details
- [docs/SECURITY.md](docs/SECURITY.md) - Security policy

## Related Projects

- [Speckit](https://github.com/github/speckit) - Specification-driven development framework
- [Model Context Protocol](https://modelcontextprotocol.io) - Protocol for LLM tool integration

## Support

- **Issues**: [GitHub Issues](https://github.com/kenzot25/speckit-autopilot/issues)
- **Questions**: Open a discussion on GitHub

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

Made with ❤️ for the Speckit community
