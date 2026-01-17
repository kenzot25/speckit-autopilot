# Command Templates

This directory contains command templates that are installed to your project's `.cursor/commands/` directory.

## Available Templates

- **`speckit.autopilot.md`** - Full workflow automation command
- **`speckit.review.md`** - Comprehensive code review command

## Installation

These templates are automatically installed when you run:
```bash
./setup-mcp.sh
```

Or manually:
```bash
./install-commands.sh
```

## Usage

After installation, the commands are available in Cursor:
- `/speckit.autopilot <feature description>` - Full workflow automation
- `/speckit.review` - Code review and fixes

## For Other Projects

To use these commands in other projects:

1. Copy the template files to that project's `.cursor/commands/` directory:
   ```bash
   cp templates/commands/*.md /path/to/other/project/.cursor/commands/
   ```

2. Configure the MCP server in that project (see main README.md)

3. Use the commands in Cursor

## Customization

You can customize these templates for your project by editing them after installation. The installed files are in your project's `.cursor/commands/` directory and won't be overwritten unless you run `install-commands.sh` again.
