import { describe, it, expect, beforeAll } from '@jest/globals';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../..');
const distRoot = path.join(projectRoot, 'dist');

describe('Build Output Integration Tests', () => {
  beforeAll(async () => {
    // Ensure dist directory exists - build if needed
    try {
      await fs.access(distRoot);
    } catch {
      // Build the project
      const { execSync } = await import('child_process');
      execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
      // Verify it exists now
      await fs.access(distRoot);
    }
  });

  // Test that we can import from dist/ after build
  describe('Module Imports', () => {
    it('should import tools from dist/tools', async () => {
      const toolsPath = path.join(distRoot, 'tools', 'specify.js');
      const { speckitSpecify } = await import(toolsPath);
      expect(typeof speckitSpecify).toBe('function');
    });

    it('should import clarify from dist/tools', async () => {
      const toolsPath = path.join(distRoot, 'tools', 'clarify.js');
      const { speckitClarify } = await import(toolsPath);
      expect(typeof speckitClarify).toBe('function');
    });

    it('should import plan from dist/tools', async () => {
      const toolsPath = path.join(distRoot, 'tools', 'plan.js');
      const { speckitPlan } = await import(toolsPath);
      expect(typeof speckitPlan).toBe('function');
    });

    it('should import tasks from dist/tools', async () => {
      const toolsPath = path.join(distRoot, 'tools', 'tasks.js');
      const { speckitTasks } = await import(toolsPath);
      expect(typeof speckitTasks).toBe('function');
    });

    it('should import implement from dist/tools', async () => {
      const toolsPath = path.join(distRoot, 'tools', 'implement.js');
      const { speckitImplement, markTaskAsComplete } = await import(toolsPath);
      expect(typeof speckitImplement).toBe('function');
      expect(typeof markTaskAsComplete).toBe('function');
    });

    it('should import review from dist/tools', async () => {
      const toolsPath = path.join(distRoot, 'tools', 'review.js');
      const { speckitReview } = await import(toolsPath);
      expect(typeof speckitReview).toBe('function');
    });

    it('should import autopilot from dist/tools', async () => {
      const toolsPath = path.join(distRoot, 'tools', 'autopilot.js');
      const { speckitAutopilot } = await import(toolsPath);
      expect(typeof speckitAutopilot).toBe('function');
    });

    it('should import utilities from dist/utils', async () => {
      const utilsPath = path.join(distRoot, 'utils', 'scripts.js');
      const utils = await import(utilsPath);
      expect(typeof utils.executeScript).toBe('function');
      expect(typeof utils.executeScriptJSON).toBe('function');
      expect(typeof utils.parseJSONFromOutput).toBe('function');
      expect(typeof utils.getRepoRoot).toBe('function');
      expect(typeof utils.getFeaturePaths).toBe('function');
    });

    it('should import file utilities from dist/utils', async () => {
      const filesPath = path.join(distRoot, 'utils', 'files.js');
      const files = await import(filesPath);
      expect(typeof files.readFile).toBe('function');
      expect(typeof files.writeFile).toBe('function');
      expect(typeof files.fileExists).toBe('function');
      expect(typeof files.parseTasksMd).toBe('function');
      expect(typeof files.markTaskComplete).toBe('function');
      expect(typeof files.getIncompleteTasks).toBe('function');
    });

    it('should import state utilities from dist/utils', async () => {
      const statePath = path.join(distRoot, 'utils', 'state.js');
      const state = await import(statePath);
      expect(typeof state.getWorkflowState).toBe('function');
      expect(typeof state.setWorkflowState).toBe('function');
      expect(typeof state.initWorkflowState).toBe('function');
      expect(typeof state.updateWorkflowState).toBe('function');
    });
  });
});
