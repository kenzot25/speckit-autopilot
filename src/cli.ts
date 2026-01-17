#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Config {
  command: string;
  args: string[];
}

/**
 * Get repository root (where MCP server is located)
 */
function getMCPRoot(): string {
  // CLI is in dist/cli.js, MCP root is parent of dist
  // __dirname is dist/ when running from dist/cli.js
  // So MCP root is parent of dist
  const distDir = __dirname;
  const mcpRoot = path.dirname(distDir);
  
  // Verify we're in the right place by checking for package.json
  const packageJson = path.join(mcpRoot, 'package.json');
  if (fsSync.existsSync(packageJson)) {
    return mcpRoot;
  }
  
  // Fallback: assume we're in speckit-autopilot directory
  return process.cwd();
}

/**
 * Get project root (directory with .cursor/.specify, prioritizing current working directory)
 */
function getProjectRoot(): string {
  // First, check current working directory (most reliable when user runs from project root)
  const cwd = process.cwd();
  const cwdCursorDir = path.join(cwd, '.cursor');
  const cwdSpecifyDir = path.join(cwd, '.specify');
  if (fsSync.existsSync(cwdCursorDir) || fsSync.existsSync(cwdSpecifyDir)) {
    return cwd;
  }
  
  const mcpRoot = getMCPRoot();
  const mcpRootName = path.basename(mcpRoot);
  const homeDir = os.homedir();
  
  // If we're in speckit-autopilot, check if parent has .cursor or .specify
  if (mcpRootName === 'speckit-autopilot' || mcpRootName === 'mcp-speckit-server') {
    const parent = path.dirname(mcpRoot);
    const cursorDir = path.join(parent, '.cursor');
    const specifyDir = path.join(parent, '.specify');
    if (fsSync.existsSync(cursorDir) || fsSync.existsSync(specifyDir)) {
      return parent;
    }
  }
  
  // Try to find project root by looking for .cursor or .specify starting from MCP root
  let current = mcpRoot;
  for (let i = 0; i < 5; i++) {
    const cursorDir = path.join(current, '.cursor');
    const specifyDir = path.join(current, '.specify');
    if (fsSync.existsSync(cursorDir) || fsSync.existsSync(specifyDir)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break; // Reached root
    current = parent;
  }
  
  // Don't fallback to home directory - require explicit project directory
  // If we're in home directory or install directory, throw error
  if (cwd === homeDir || cwd.startsWith(homeDir + '/.speckit-autopilot')) {
    throw new Error(
      'No project directory found. Please run this command from your project directory.\n' +
      'A project directory should contain a .cursor or .specify folder.\n' +
      `Current directory: ${cwd}\n` +
      'Example: cd /path/to/your/project && speckit-autopilot setup'
    );
  }
  
  // Last fallback: use current working directory (but warn)
  return cwd;
}

/**
 * Read JSON file
 */
async function readJSON<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Write JSON file
 */
async function writeJSON(filePath: string, data: any): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Setup MCP server configuration
 */
async function setupMCP(): Promise<void> {
  const mcpRoot = getMCPRoot();
  const projectRoot = getProjectRoot();
  const mcpServerPath = path.join(mcpRoot, 'dist', 'index.js');
  const projectMCPConfig = path.join(projectRoot, '.cursor', 'mcp.json');

  console.log('Setting up Speckit Autopilot...');
  console.log(`Repository root: ${projectRoot}`);
  console.log(`MCP server path: ${mcpServerPath}`);

  // Check if server is built
  if (!(await fileExists(mcpServerPath))) {
    console.log('Building MCP server...');
    const { execSync } = await import('child_process');
    const originalCwd = process.cwd();
    try {
      process.chdir(mcpRoot);
      execSync('npm install', { stdio: 'inherit' });
      execSync('npm run build', { stdio: 'inherit' });
    } finally {
      process.chdir(originalCwd);
    }
  }

  // Read existing config or create new
  const existingConfig = await readJSON<any>(projectMCPConfig);
  
  // Preserve all existing properties and merge mcpServers
  const config: any = existingConfig || {};
  
  // Ensure mcpServers object exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  // Add or update speckit server (preserve other servers)
  config.mcpServers.speckit = {
    command: 'node',
    args: [mcpServerPath],
  };

  await writeJSON(projectMCPConfig, config);

  console.log('');
  console.log('✓ Project MCP configuration created!');
  console.log(`Configuration file: ${projectMCPConfig}`);
  console.log(`MCP server path: ${mcpServerPath}`);
}

/**
 * Install Speckit commands from templates
 */
async function installCommands(): Promise<void> {
  const mcpRoot = getMCPRoot();
  const projectRoot = getProjectRoot();
  const templatesDir = path.join(mcpRoot, 'templates', 'commands');
  const targetDir = path.join(projectRoot, '.cursor', 'commands');

  console.log('Installing Speckit commands...');
  console.log(`Templates directory: ${templatesDir}`);
  console.log(`Target directory: ${targetDir}`);
  console.log('');

  // Create target directory
  await fs.mkdir(targetDir, { recursive: true });

  // Install autopilot command
  const autopilotTemplate = path.join(templatesDir, 'speckit.autopilot.md');
  const autopilotTarget = path.join(targetDir, 'speckit.autopilot.md');
  
  if (await fileExists(autopilotTemplate)) {
    await fs.copyFile(autopilotTemplate, autopilotTarget);
    console.log('✓ Installed speckit.autopilot.md');
  } else {
    console.log(`⚠ Warning: Template not found: ${autopilotTemplate}`);
  }

  // Install review command
  const reviewTemplate = path.join(templatesDir, 'speckit.review.md');
  const reviewTarget = path.join(targetDir, 'speckit.review.md');
  
  if (await fileExists(reviewTemplate)) {
    await fs.copyFile(reviewTemplate, reviewTarget);
    console.log('✓ Installed speckit.review.md');
  } else {
    console.log(`⚠ Warning: Template not found: ${reviewTemplate}`);
  }

  console.log('');
  console.log('✓ Speckit commands installed!');
  console.log('');
  console.log('Available commands (provided by this MCP server):');
  console.log('  - /speckit.autopilot - Full workflow automation (NEW - not in standard Speckit)');
  console.log('  - /speckit.review - Code review and fixes (NEW - not in standard Speckit)');
  console.log('');
  console.log(`Commands installed to: ${targetDir}`);
}

/**
 * Verify installation
 */
async function verifyInstallation(): Promise<void> {
  const projectRoot = getProjectRoot();
  const mcpConfig = path.join(projectRoot, '.cursor', 'mcp.json');
  const commandsDir = path.join(projectRoot, '.cursor', 'commands');
  const autopilotCmd = path.join(commandsDir, 'speckit.autopilot.md');
  const reviewCmd = path.join(commandsDir, 'speckit.review.md');
  const mcpRoot = getMCPRoot();
  const serverPath = path.join(mcpRoot, 'dist', 'index.js');

  console.log('Verifying installation...');
  console.log('');

  let allGood = true;

  // Check MCP config
  if (await fileExists(mcpConfig)) {
    const config = await readJSON<{ mcpServers?: Record<string, Config> }>(mcpConfig);
    if (config?.mcpServers?.speckit) {
      console.log('✓ MCP server configured');
    } else {
      console.log('✗ MCP server not configured');
      allGood = false;
    }
  } else {
    console.log('✗ MCP config file not found');
    allGood = false;
  }

  // Check server file
  if (await fileExists(serverPath)) {
    console.log('✓ MCP server built');
  } else {
    console.log('✗ MCP server not built (run: npm run build)');
    allGood = false;
  }

  // Check commands
  if (await fileExists(autopilotCmd)) {
    console.log('✓ speckit.autopilot.md installed');
  } else {
    console.log('✗ speckit.autopilot.md not found');
    allGood = false;
  }

  if (await fileExists(reviewCmd)) {
    console.log('✓ speckit.review.md installed');
  } else {
    console.log('✗ speckit.review.md not found');
    allGood = false;
  }

  console.log('');
  if (allGood) {
    console.log('✓ All checks passed! Installation is complete.');
  } else {
    console.log('⚠ Some checks failed. Run "speckit-autopilot setup" to fix.');
  }
}

/**
 * Show help
 */
function showHelp(): void {
  console.log(`
Speckit Autopilot CLI

Usage:
  speckit-autopilot <command> [options]

Commands:
  setup              Setup MCP server and install commands
  install-commands   Install Speckit commands only
  verify             Verify installation
  help               Show this help message

Examples:
  speckit-autopilot setup              # Full setup (MCP + commands)
  speckit-autopilot install-commands   # Install commands only
  speckit-autopilot verify              # Verify installation

For more information, see README.md
`);
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  try {
    switch (command) {
      case 'setup':
        await setupMCP();
        await installCommands();
        console.log('');
        console.log('✓ Setup complete!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Restart Cursor completely (Cmd+Q on macOS, fully quit the app)');
        console.log('2. Cursor will automatically start the MCP server when needed');
        console.log('3. The speckit MCP tools should appear in Cursor');
        console.log('4. The /speckit.autopilot and /speckit.review commands are now available');
        console.log('');
        console.log('Try it out:');
        console.log('  /speckit.autopilot Add a new feature');
        console.log('  speckit-autopilot --help');
        console.log('');
        console.log('Note: You need to run "speckit-autopilot setup" in each project directory');
        console.log('      where you want to use Speckit Autopilot. The MCP server runs automatically.');
        break;

      case 'install-commands':
      case 'install':
        await installCommands();
        break;

      case 'verify':
        await verifyInstallation();
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.error('');
        showHelp();
        process.exit(1);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run CLI
main();
