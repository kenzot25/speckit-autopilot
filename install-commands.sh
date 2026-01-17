#!/bin/bash

# Install Speckit commands (speckit.autopilot and speckit.review) to project
# These commands are provided by this MCP server and extend standard Speckit

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_COMMANDS_DIR="$REPO_ROOT/.cursor/commands"
TEMPLATES_DIR="$SCRIPT_DIR/templates/commands"

echo "Installing Speckit commands..."
echo "Templates directory: $TEMPLATES_DIR"
echo "Target directory: $PROJECT_COMMANDS_DIR"
echo ""

# Create commands directory if it doesn't exist
mkdir -p "$PROJECT_COMMANDS_DIR"

# Install autopilot command
if [ -f "$TEMPLATES_DIR/speckit.autopilot.md" ]; then
    cp "$TEMPLATES_DIR/speckit.autopilot.md" "$PROJECT_COMMANDS_DIR/speckit.autopilot.md"
    echo "✓ Installed speckit.autopilot.md"
else
    echo "⚠ Warning: Template not found: $TEMPLATES_DIR/speckit.autopilot.md"
fi

# Install review command
if [ -f "$TEMPLATES_DIR/speckit.review.md" ]; then
    cp "$TEMPLATES_DIR/speckit.review.md" "$PROJECT_COMMANDS_DIR/speckit.review.md"
    echo "✓ Installed speckit.review.md"
else
    echo "⚠ Warning: Template not found: $TEMPLATES_DIR/speckit.review.md"
fi

echo ""
echo "✓ Speckit commands installed!"
echo ""
echo "Available commands (provided by this MCP server):"
echo "  - /speckit.autopilot - Full workflow automation (NEW - not in standard Speckit)"
echo "  - /speckit.review - Code review and fixes (NEW - not in standard Speckit)"
echo ""
echo "Commands installed to: $PROJECT_COMMANDS_DIR"
echo ""
echo "They will work automatically when you use Cursor in this project."
echo "To use them in other projects:"
echo "  1. Copy the .md files from $PROJECT_COMMANDS_DIR to that project's .cursor/commands/ directory"
echo "  2. Or run this script in that project after installing the MCP server"
echo ""
echo "Make sure the MCP server is configured:"
echo "  Run './setup-mcp.sh' to configure the MCP server."
