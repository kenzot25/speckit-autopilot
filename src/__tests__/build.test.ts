import { describe, it, expect, beforeAll } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

describe('Build Verification', () => {
  beforeAll(async () => {
    // Ensure build directory exists
    const distDir = path.join(projectRoot, 'dist');
    try {
      await fs.access(distDir);
    } catch {
      // Build directory doesn't exist, build will create it
    }
  });

  it('should build the project successfully', () => {
    expect(() => {
      execSync('npm run build', {
        cwd: projectRoot,
        stdio: 'pipe',
        encoding: 'utf-8',
      });
    }).not.toThrow();
  });

  it('should generate dist/index.js', async () => {
    const indexPath = path.join(projectRoot, 'dist/index.js');
    const exists = await fs.access(indexPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('should generate dist/cli.js', async () => {
    const cliPath = path.join(projectRoot, 'dist/cli.js');
    const exists = await fs.access(cliPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('should generate all tool files in dist/tools/', async () => {
    const toolsDir = path.join(projectRoot, 'dist/tools');
    const expectedFiles = [
      'specify.js',
      'clarify.js',
      'plan.js',
      'tasks.js',
      'implement.js',
      'review.js',
      'autopilot.js',
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(toolsDir, file);
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    }
  });

  it('should generate all utility files in dist/utils/', async () => {
    const utilsDir = path.join(projectRoot, 'dist/utils');
    const expectedFiles = [
      'scripts.js',
      'files.js',
      'state.js',
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(utilsDir, file);
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    }
  });

  it('should generate TypeScript declaration files', async () => {
    const distDir = path.join(projectRoot, 'dist');
    const expectedDirs = ['tools', 'utils'];
    
    for (const dir of expectedDirs) {
      const dirPath = path.join(distDir, dir);
      const files = await fs.readdir(dirPath);
      const hasDtsFiles = files.some(f => f.endsWith('.d.ts'));
      expect(hasDtsFiles).toBe(true);
    }
  });

  it('should have valid JavaScript syntax in dist/index.js', async () => {
    const indexPath = path.join(projectRoot, 'dist/index.js');
    const content = await fs.readFile(indexPath, 'utf-8');
    
    // Check for ES module syntax
    expect(content).toMatch(/^#!/); // Shebang
    expect(content).toMatch(/import\s+/); // ES6 imports
    expect(content).not.toMatch(/require\(/); // No CommonJS require
  });
});
