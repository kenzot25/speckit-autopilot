#!/bin/bash

# Speckit Autopilot Installation Script
# This script installs Speckit Autopilot CLI and sets up the MCP server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
INSTALL_DIR="${SPECKIT_AUTOPILOT_DIR:-$HOME/.speckit-autopilot}"
INSTALL_GLOBAL=false
SKIP_SETUP=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dir)
      INSTALL_DIR="$2"
      shift 2
      ;;
    --global)
      INSTALL_GLOBAL=true
      shift
      ;;
    --skip-setup)
      SKIP_SETUP=true
      shift
      ;;
    --help|-h)
      echo "Speckit Autopilot Installation Script"
      echo ""
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --dir <path>      Installation directory (default: ~/.speckit-autopilot)"
      echo "  --global          Install globally via npm (requires sudo)"
      echo "  --skip-setup      Skip MCP server setup (just install CLI)"
      echo "  --help, -h         Show this help message"
      echo ""
      echo "Examples:"
      echo "  curl -fsSL https://raw.githubusercontent.com/kenzot25/speckit-autopilot/master/install.sh | sh"
      echo "  curl -fsSL https://raw.githubusercontent.com/kenzot25/speckit-autopilot/master/install.sh | sh -s -- --global"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Speckit Autopilot Installation      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}✗ Node.js version 20+ is required (found: $(node -v))${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v)${NC}"
echo ""

# Determine installation method
if [ "$INSTALL_GLOBAL" = true ]; then
    echo -e "${BLUE}Installing globally via npm...${NC}"
    
    # Clone or use existing directory
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    echo "Cloning repository..."
    git clone --depth 1 https://github.com/kenzot25/speckit-autopilot.git . 2>/dev/null || {
        echo -e "${YELLOW}Git not available, downloading from GitHub...${NC}"
        curl -fsSL https://github.com/kenzot25/speckit-autopilot/archive/main.zip -o repo.zip
        unzip -q repo.zip
        cd speckit-autopilot-main
    }
    
    echo "Installing dependencies..."
    npm install
    
    echo "Building..."
    npm run build
    
    echo "Installing globally..."
    npm install -g .
    
    # Find the installed binary location
    if command -v speckit-autopilot &> /dev/null; then
        INSTALLED_BIN=$(which speckit-autopilot)
        echo -e "${GREEN}✓ Installed globally at: $INSTALLED_BIN${NC}"
    else
        echo -e "${GREEN}✓ Installed globally${NC}"
    fi
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$TEMP_DIR"
    
    INSTALL_DIR="$(npm prefix -g 2>/dev/null || echo '/usr/local')"
else
    echo -e "${BLUE}Installing to: $INSTALL_DIR${NC}"
    
    # Create installation directory
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    # Clone or download repository
    if [ -d ".git" ]; then
        echo "Updating existing installation..."
        git pull --quiet || true
    else
        echo "Cloning repository..."
        if command -v git &> /dev/null; then
            git clone --depth 1 https://github.com/kenzot25/speckit-autopilot.git . 2>/dev/null || {
                echo -e "${YELLOW}Git clone failed, downloading from GitHub...${NC}"
                curl -fsSL https://github.com/kenzot25/speckit-autopilot/archive/main.zip -o repo.zip
                unzip -q repo.zip
                mv speckit-autopilot-main/* .
                mv speckit-autopilot-main/.* . 2>/dev/null || true
                rm -rf speckit-autopilot-main repo.zip
            }
        else
            echo "Downloading from GitHub..."
            curl -fsSL https://github.com/kenzot25/speckit-autopilot/archive/main.zip -o repo.zip
            unzip -q repo.zip
            mv speckit-autopilot-main/* .
            mv speckit-autopilot-main/.* . 2>/dev/null || true
            rm -rf speckit-autopilot-main repo.zip
        fi
    fi
    
    echo "Installing dependencies..."
    npm install
    
    echo "Building..."
    npm run build
    
    echo -e "${GREEN}✓ Installed to: $INSTALL_DIR${NC}"
    
    # Create symlink in a directory that's in PATH
    LOCAL_BIN="$HOME/.local/bin"
    if [ -d "$HOME/.local/bin" ] || mkdir -p "$LOCAL_BIN" 2>/dev/null; then
        SYMLINK="$LOCAL_BIN/speckit-autopilot"
        ln -sf "$INSTALL_DIR/dist/cli.js" "$SYMLINK"
        chmod +x "$SYMLINK"
        echo -e "${GREEN}✓ Created symlink: $SYMLINK${NC}"
        
        # Check if ~/.local/bin is in PATH
        if [[ ":$PATH:" != *":$LOCAL_BIN:"* ]]; then
            echo -e "${YELLOW}⚠ Warning: $LOCAL_BIN is not in your PATH${NC}"
            echo "Add this to your ~/.bashrc, ~/.zshrc, or ~/.profile:"
            echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
        fi
    fi
fi

echo ""

# Don't run setup automatically - user needs to run it in their project directory
echo -e "${YELLOW}Note:${NC} Setup will be skipped during installation."
echo "      You need to run setup in your project directory after installation."

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Installation Complete!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Navigate to your project directory:"
echo "     cd /path/to/your/project"
echo ""
echo "  2. Run setup in your project:"
echo "     speckit-autopilot setup"
echo ""
echo "  3. Restart Cursor completely (Cmd+Q on macOS, fully quit the app)"
echo ""
echo "  4. Cursor will automatically start the MCP server when needed"
echo "     The speckit MCP tools should appear in Cursor"
echo ""
echo "  5. Try the commands:"
if [ "$INSTALL_GLOBAL" = true ]; then
    echo "     ${BLUE}speckit-autopilot --help${NC}"
else
    echo "     ${BLUE}speckit-autopilot --help${NC}"
    echo "     (or: ${BLUE}node $INSTALL_DIR/dist/cli.js --help${NC})"
fi
echo "     ${BLUE}/speckit.autopilot <feature description>${NC}"
echo ""
echo -e "${BLUE}Important:${NC} You must run 'speckit-autopilot setup' in each project directory"
echo "            where you want to use Speckit Autopilot."
echo "            The MCP server runs automatically - no manual server management needed."
echo ""
echo "For more information, see:"
echo "  https://github.com/kenzot25/speckit-autopilot"
