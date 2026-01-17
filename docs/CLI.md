# CLI Documentation

Speckit Autopilot includes a command-line interface (CLI) for easy setup and management.

## Installation

### Local Usage

```bash
cd speckit-autopilot
npm install
npm run build
npx speckit-autopilot <command>
```

### Global Installation

```bash
cd speckit-autopilot
npm install -g .
speckit-autopilot <command>
```

## Commands

### `setup`

Complete setup: configures MCP server and installs Speckit commands.

```bash
speckit-autopilot setup
```

**What it does**:
1. Builds MCP server (if not already built)
2. Creates/updates `.cursor/mcp.json` with MCP server configuration
3. Installs command templates to `.cursor/commands/`
4. Provides next steps

**Example output**:
```
Setting up Speckit Autopilot...
Repository root: /path/to/project
MCP server path: /path/to/project/speckit-autopilot/dist/index.js

✓ Project MCP configuration created!
Installing Speckit commands...
✓ Installed speckit.autopilot.md
✓ Installed speckit.review.md

✓ Speckit commands installed!
```

### `install-commands`

Install Speckit commands only (useful if MCP server is already configured).

```bash
speckit-autopilot install-commands
```

**What it does**:
1. Copies command templates from `templates/commands/` to `.cursor/commands/`
2. Installs `speckit.autopilot.md` and `speckit.review.md`

### `verify`

Verify installation and check that everything is configured correctly.

```bash
speckit-autopilot verify
```

**What it checks**:
- ✓ MCP server configured in `.cursor/mcp.json`
- ✓ MCP server built (`dist/index.js` exists)
- ✓ `speckit.autopilot.md` installed
- ✓ `speckit.review.md` installed

**Example output**:
```
Verifying installation...

✓ MCP server configured
✓ MCP server built
✓ speckit.autopilot.md installed
✓ speckit.review.md installed

✓ All checks passed! Installation is complete.
```

### `help`

Show help message with available commands.

```bash
speckit-autopilot help
```

## Usage Examples

### First Time Setup

```bash
# Clone or navigate to project with MCP server
cd speckit-autopilot

# Install dependencies and build
npm install
npm run build

# Run setup
npx speckit-autopilot setup

# Restart Cursor and use commands!
```

### Update Commands Only

If you've updated command templates and want to reinstall:

```bash
npx speckit-autopilot install-commands
```

### Check Installation

```bash
npx speckit-autopilot verify
```

## Troubleshooting

### "Command not found"

If you get "command not found" error:

1. **Use npx** (recommended):
   ```bash
   npx speckit-autopilot setup
   ```

2. **Or install globally**:
   ```bash
   npm install -g .
   speckit-autopilot setup
   ```

3. **Or use node directly**:
   ```bash
   node dist/cli.js setup
   ```

### "MCP server not built"

Run build first:
```bash
npm run build
```

### Path Issues

The CLI automatically detects paths, but if you have issues:

1. Make sure you're running from the `speckit-autopilot` directory
2. Or run from project root and specify paths manually

## Advanced Usage

### Custom Paths

The CLI automatically detects:
- MCP server root (where `package.json` is)
- Project root (parent directory or where `.cursor/` or `.specify/` exists)

If detection fails, you can manually edit the generated `.cursor/mcp.json` file.

### Multiple Projects

To use in multiple projects:

1. **Option 1**: Run CLI in each project
   ```bash
   cd project1
   npx speckit-autopilot setup
   
   cd ../project2
   npx speckit-autopilot setup
   ```

2. **Option 2**: Install globally and run in each project
   ```bash
   npm install -g /path/to/speckit-autopilot
   
   cd project1
   speckit-autopilot setup
   
   cd ../project2
   speckit-autopilot setup
   ```

## Comparison with Bash Scripts

The CLI replaces the bash scripts (`setup-mcp.sh`, `install-commands.sh`) with a cross-platform Node.js solution:

**Advantages**:
- ✅ Works on Windows, macOS, and Linux
- ✅ No shell script dependencies
- ✅ Better error handling
- ✅ Consistent behavior across platforms
- ✅ Can be installed as npm package

**Bash scripts are still available** for users who prefer them, but the CLI is the recommended method.
