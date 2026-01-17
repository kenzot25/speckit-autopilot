#!/bin/bash

# Setup script to configure MCP server for Cursor

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_SERVER_PATH="$REPO_ROOT/speckit-autopilot/dist/index.js"
PROJECT_MCP_CONFIG="$REPO_ROOT/.cursor/mcp.json"
CURSOR_MCP_CONFIG="$HOME/.cursor/mcp.json"

echo "Setting up Speckit Autopilot..."
echo "Repository root: $REPO_ROOT"
echo "MCP server path: $MCP_SERVER_PATH"

# Check if server is built
if [ ! -f "$MCP_SERVER_PATH" ]; then
    echo "Building MCP server..."
    cd "$REPO_ROOT/speckit-autopilot"
    npm install
    npm run build
fi

# Create project-local config (this is what Cursor will use)
mkdir -p "$(dirname "$PROJECT_MCP_CONFIG")"

if [ -f "$PROJECT_MCP_CONFIG" ]; then
    echo "Found existing project MCP config at $PROJECT_MCP_CONFIG"
    
    # Check if speckit server already configured
    if grep -q '"speckit"' "$PROJECT_MCP_CONFIG" 2>/dev/null; then
        echo "Speckit server already configured in project MCP config"
        echo "Updating path..."
    else
        echo "Adding speckit server to project config..."
    fi
else
    echo "Creating project MCP config at $PROJECT_MCP_CONFIG"
fi

# Create/update project config
cat > "$PROJECT_MCP_CONFIG" <<EOF
{
  "mcpServers": {
    "speckit": {
      "command": "node",
      "args": ["$MCP_SERVER_PATH"]
    }
  }
}
EOF

echo ""
echo "✓ Project MCP configuration created!"
echo ""
echo "Configuration file: $PROJECT_MCP_CONFIG"
echo "MCP server path: $MCP_SERVER_PATH"
echo ""
echo "Installing Speckit commands..."
if [ -f "$SCRIPT_DIR/install-commands.sh" ]; then
    "$SCRIPT_DIR/install-commands.sh"
else
    echo "⚠ Warning: install-commands.sh not found"
fi
echo ""
echo "Note: Cursor may also use global config at $CURSOR_MCP_CONFIG"
echo "      You can manually add the same configuration there if needed."
echo ""
echo "Next steps:"
echo "1. Restart Cursor completely (Cmd+Q on macOS, fully quit the app)"
echo "2. The speckit tools should appear in Cursor"
echo "3. Try calling '/speckit.autopilot' with a feature description"
echo ""
echo "To verify, check that the files exist:"
echo "  ls -la $PROJECT_MCP_CONFIG"
echo "  ls -la $PROJECT_COMMANDS_DIR/speckit.*.md"