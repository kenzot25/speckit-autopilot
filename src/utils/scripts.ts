import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const execAsync = promisify(exec);

export interface ScriptResult {
  stdout: string;
  stderr: string;
  success: boolean;
}

/**
 * Execute a command or script (cross-platform)
 * Can execute:
 * - Commands directly (e.g., 'npm', 'flutter', 'python')
 * - Bash scripts (on Unix) or batch scripts (on Windows)
 */
export async function executeScript(
  commandOrScript: string,
  args: string[] = [],
  options: { cwd?: string; timeout?: number; shell?: string } = {}
): Promise<ScriptResult> {
  const { cwd, timeout = 30000, shell } = options;
  const platform = os.platform();
  
  // Check if it's a script file path
  const isScriptFile = fs.existsSync(commandOrScript) && 
    (commandOrScript.endsWith('.sh') || commandOrScript.endsWith('.bat') || commandOrScript.endsWith('.cmd'));
  
  let command: string;
  
  if (isScriptFile) {
    // Execute script file
    const fullPath = path.isAbsolute(commandOrScript) 
      ? commandOrScript 
      : path.resolve(cwd || process.cwd(), commandOrScript);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Script not found: ${fullPath}`);
    }
    
    if (platform === 'win32') {
      // Windows: use cmd.exe for .bat/.cmd, or PowerShell for .ps1
      if (fullPath.endsWith('.bat') || fullPath.endsWith('.cmd')) {
        command = `"${fullPath}" ${args.map(arg => `"${arg}"`).join(' ')}`;
      } else {
        // For .sh files on Windows, try Git Bash or WSL
        command = `bash "${fullPath}" ${args.map(arg => `"${arg}"`).join(' ')}`;
      }
    } else {
      // Unix: use bash
      command = `bash "${fullPath}" ${args.map(arg => `"${arg}"`).join(' ')}`;
    }
  } else {
    // Execute command directly
    // Escape arguments for cross-platform compatibility
    const escapedArgs = args.map(arg => {
      // If argument contains spaces or special chars, quote it
      if (arg.includes(' ') || arg.includes('"') || arg.includes("'")) {
        return `"${arg.replace(/"/g, '\\"')}"`;
      }
      return arg;
    });
    
    command = `${commandOrScript} ${escapedArgs.join(' ')}`;
  }
  
  // Use specified shell or platform default
  const shellToUse = shell || (platform === 'win32' ? 'cmd.exe' : '/bin/bash');
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd || process.cwd(),
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      shell: shellToUse,
    });
    
    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      success: true,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || error.message || '',
      success: false,
    };
  }
}

/**
 * Parse JSON from script output, handling cases where script outputs text before/after JSON
 * This is exported for testing purposes
 */
export function parseJSONFromOutput<T = any>(output: string): T {
  // Try to parse JSON directly first
  try {
    return JSON.parse(output) as T;
  } catch {
    // If direct parse fails, try to extract JSON from mixed output
    // Look for JSON object (starts with { and ends with }) or array (starts with [ and ends with ])
    // We need to find the first complete JSON structure by counting braces/brackets
    
    // Try to find JSON object first (most common case)
    const objectStart = output.indexOf('{');
    const arrayStart = output.indexOf('[');
    
    // Determine which comes first and what type we're looking for
    let startIndex = -1;
    let isArray = false;
    
    if (objectStart !== -1 && (arrayStart === -1 || objectStart < arrayStart)) {
      startIndex = objectStart;
      isArray = false;
    } else if (arrayStart !== -1) {
      startIndex = arrayStart;
      isArray = true;
    }
    
    if (startIndex !== -1) {
      // Extract JSON by counting braces/brackets to find the complete structure
      let jsonStr = '';
      let braceCount = 0;
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      
      for (let i = startIndex; i < output.length; i++) {
        const char = output[i];
        
        if (escapeNext) {
          jsonStr += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          jsonStr += char;
          escapeNext = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          jsonStr += char;
          continue;
        }
        
        if (inString) {
          jsonStr += char;
          continue;
        }
        
        if (char === '{') {
          braceCount++;
          jsonStr += char;
        } else if (char === '}') {
          braceCount--;
          jsonStr += char;
          if (braceCount === 0 && bracketCount === 0) {
            break;
          }
        } else if (char === '[') {
          bracketCount++;
          jsonStr += char;
        } else if (char === ']') {
          bracketCount--;
          jsonStr += char;
          if (braceCount === 0 && bracketCount === 0) {
            break;
          }
        } else {
          jsonStr += char;
        }
      }
      
      try {
        return JSON.parse(jsonStr) as T;
      } catch (parseError) {
        // If extracted JSON still fails, throw original error
        throw new Error(`Failed to parse JSON output: ${output}`);
      }
    }
    
    // No JSON found in output
    throw new Error(`Failed to parse JSON output: ${output}`);
  }
}

/**
 * Execute a script and parse JSON output
 * Handles cases where script outputs text before JSON
 */
export async function executeScriptJSON<T = any>(
  scriptPath: string,
  args: string[] = [],
  options: { cwd?: string } = {}
): Promise<T> {
  const result = await executeScript(scriptPath, [...args, '--json'], options);
  
  if (!result.success) {
    throw new Error(`Script failed: ${result.stderr}`);
  }
  
  return parseJSONFromOutput<T>(result.stdout);
}

/**
 * Get repository root directory
 */
export function getRepoRoot(): string {
  try {
    const result = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' });
    return result.trim();
  } catch {
    // Fallback to current working directory
    return process.cwd();
  }
}

/**
 * Get feature paths using check-prerequisites script
 * If featureDir is provided, constructs paths directly to avoid conflicts with multiple specs sharing the same prefix
 */
export async function getFeaturePaths(options: {
  requireTasks?: boolean;
  includeTasks?: boolean;
  pathsOnly?: boolean;
  featureDir?: string;
} = {}): Promise<{
  REPO_ROOT: string;
  BRANCH: string;
  FEATURE_DIR: string;
  FEATURE_SPEC: string;
  IMPL_PLAN: string;
  TASKS: string;
  AVAILABLE_DOCS?: string[];
}> {
  const repoRoot = getRepoRoot();
  
  // If featureDir is provided, construct paths directly to avoid script lookup conflicts
  if (options.featureDir) {
    const absoluteFeatureDir = path.isAbsolute(options.featureDir)
      ? options.featureDir
      : path.join(repoRoot, options.featureDir);
    
    const branchName = path.basename(absoluteFeatureDir);
    
    return {
      REPO_ROOT: repoRoot,
      BRANCH: branchName,
      FEATURE_DIR: absoluteFeatureDir,
      FEATURE_SPEC: path.join(absoluteFeatureDir, 'spec.md'),
      IMPL_PLAN: path.join(absoluteFeatureDir, 'plan.md'),
      TASKS: path.join(absoluteFeatureDir, 'tasks.md'),
    };
  }
  
  // Fall back to script lookup (may fail if multiple specs share prefix)
  const scriptPath = path.join(repoRoot, '.specify/scripts/bash/check-prerequisites.sh');
  
  const args: string[] = [];
  if (options.requireTasks) args.push('--require-tasks');
  if (options.includeTasks) args.push('--include-tasks');
  if (options.pathsOnly) args.push('--paths-only');
  
  return executeScriptJSON(scriptPath, args, { cwd: repoRoot });
}
