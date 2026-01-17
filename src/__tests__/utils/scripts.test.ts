import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { parseJSONFromOutput, getFeaturePaths } from '../../utils/scripts.js';

describe('scripts utilities', () => {
  describe('parseJSONFromOutput', () => {
    it('should parse pure JSON output', () => {
      const output = '{"FEATURE_SPEC":"/path/to/spec.md","IMPL_PLAN":"/path/to/plan.md"}';

      const result = parseJSONFromOutput<{
        FEATURE_SPEC: string;
        IMPL_PLAN: string;
      }>(output);

      expect(result).toEqual({
        FEATURE_SPEC: '/path/to/spec.md',
        IMPL_PLAN: '/path/to/plan.md',
      });
    });

    it('should parse JSON with text before it', () => {
      const output = 'Copied plan template to /path/to/plan.md\n{"FEATURE_SPEC":"/path/to/spec.md","IMPL_PLAN":"/path/to/plan.md"}';

      const result = parseJSONFromOutput<{
        FEATURE_SPEC: string;
        IMPL_PLAN: string;
      }>(output);

      expect(result).toEqual({
        FEATURE_SPEC: '/path/to/spec.md',
        IMPL_PLAN: '/path/to/plan.md',
      });
    });

    it('should parse JSON with text after it', () => {
      const output = '{"FEATURE_SPEC":"/path/to/spec.md","IMPL_PLAN":"/path/to/plan.md"}\nPlan created successfully!';

      const result = parseJSONFromOutput<{
        FEATURE_SPEC: string;
        IMPL_PLAN: string;
      }>(output);

      expect(result).toEqual({
        FEATURE_SPEC: '/path/to/spec.md',
        IMPL_PLAN: '/path/to/plan.md',
      });
    });

    it('should parse JSON with text before and after it', () => {
      const output = 'Setting up plan...\n{"FEATURE_SPEC":"/path/to/spec.md","IMPL_PLAN":"/path/to/plan.md"}\nDone!';

      const result = parseJSONFromOutput<{
        FEATURE_SPEC: string;
        IMPL_PLAN: string;
      }>(output);

      expect(result).toEqual({
        FEATURE_SPEC: '/path/to/spec.md',
        IMPL_PLAN: '/path/to/plan.md',
      });
    });

    it('should extract first JSON object when multiple exist', () => {
      const output = 'First: {"A":"1"}\nSecond: {"B":"2"}';

      const result = parseJSONFromOutput<{ A: string }>(output);

      expect(result).toEqual({ A: '1' });
    });

    it('should handle nested JSON objects', () => {
      const output = 'Info: {"data":{"nested":{"value":123}}}';

      const result = parseJSONFromOutput<{
        data: { nested: { value: number } };
      }>(output);

      expect(result).toEqual({
        data: { nested: { value: 123 } },
      });
    });

    it('should handle JSON arrays', () => {
      const output = 'Results: [{"id":1},{"id":2}]';

      const result = parseJSONFromOutput<Array<{ id: number }>>(output);

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should handle multiline JSON', () => {
      const output = `Before JSON
{
  "FEATURE_SPEC": "/path/to/spec.md",
  "IMPL_PLAN": "/path/to/plan.md"
}
After JSON`;

      const result = parseJSONFromOutput<{
        FEATURE_SPEC: string;
        IMPL_PLAN: string;
      }>(output);

      expect(result).toEqual({
        FEATURE_SPEC: '/path/to/spec.md',
        IMPL_PLAN: '/path/to/plan.md',
      });
    });

    it('should throw error when no JSON found', () => {
      const output = 'No JSON here, just text output';

      expect(() => {
        parseJSONFromOutput(output);
      }).toThrow('Failed to parse JSON output: No JSON here, just text output');
    });

    it('should throw error when JSON is invalid', () => {
      const output = 'Invalid: {"broken": json}';

      expect(() => {
        parseJSONFromOutput(output);
      }).toThrow('Failed to parse JSON output');
    });

    it('should throw error when extracted JSON is invalid', () => {
      const output = 'Text before {invalid json} text after';

      expect(() => {
        parseJSONFromOutput(output);
      }).toThrow('Failed to parse JSON output');
    });

    it('should handle empty output', () => {
      const output = '';

      expect(() => {
        parseJSONFromOutput(output);
      }).toThrow('Failed to parse JSON output');
    });

    it('should handle whitespace-only output', () => {
      const output = '   \n\t  ';

      expect(() => {
        parseJSONFromOutput(output);
      }).toThrow('Failed to parse JSON output');
    });

    it('should handle real-world example with text before JSON', () => {
      const output = 'Copied plan template to specs/001-feature-name/plan.md\n{"FEATURE_SPEC":"specs/001-feature-name/spec.md","IMPL_PLAN":"specs/001-feature-name/plan.md","SPECS_DIR":"specs/001-feature-name","BRANCH":"001-feature-name","HAS_GIT":"true"}';

      const result = parseJSONFromOutput<{
        FEATURE_SPEC: string;
        IMPL_PLAN: string;
        SPECS_DIR: string;
        BRANCH: string;
        HAS_GIT: string;
      }>(output);

      expect(result).toEqual({
        FEATURE_SPEC: 'specs/001-feature-name/spec.md',
        IMPL_PLAN: 'specs/001-feature-name/plan.md',
        SPECS_DIR: 'specs/001-feature-name',
        BRANCH: '001-feature-name',
        HAS_GIT: 'true',
      });
    });
  });

  describe('getFeaturePaths', () => {
    it('should construct paths directly when featureDir is provided (absolute path)', async () => {
      const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speckit-test-'));
      const repoRoot = testDir;
      const featureDir = path.join(repoRoot, 'specs', '001-create-login-screen');
      
      // Create directory structure
      await fs.mkdir(featureDir, { recursive: true });
      
      // Mock process.cwd() by changing directory temporarily
      const originalCwd = process.cwd();
      process.chdir(repoRoot);
      
      try {
        // Since getRepoRoot uses git, we'll test with a relative path approach
        // The function should work correctly when featureDir is provided
        const relativeFeatureDir = 'specs/001-create-login-screen';
        const paths = await getFeaturePaths({ featureDir: relativeFeatureDir });

        // Verify paths are constructed correctly
        // Note: getRepoRoot() may normalize paths (e.g., /var -> /private/var on macOS)
        // So we use the actual REPO_ROOT returned by the function
        const expectedFeatureDir = path.join(paths.REPO_ROOT, relativeFeatureDir);
        expect(paths.FEATURE_DIR).toBe(expectedFeatureDir);
        expect(paths.FEATURE_SPEC).toBe(path.join(paths.FEATURE_DIR, 'spec.md'));
        expect(paths.IMPL_PLAN).toBe(path.join(paths.FEATURE_DIR, 'plan.md'));
        expect(paths.TASKS).toBe(path.join(paths.FEATURE_DIR, 'tasks.md'));
        expect(paths.BRANCH).toBe('001-create-login-screen');
        // REPO_ROOT should be a valid absolute path
        expect(paths.REPO_ROOT).toBeTruthy();
        expect(path.isAbsolute(paths.REPO_ROOT)).toBe(true);
        // Feature dir should be within repo root
        expect(paths.FEATURE_DIR.startsWith(paths.REPO_ROOT)).toBe(true);
      } finally {
        process.chdir(originalCwd);
        await fs.rm(testDir, { recursive: true, force: true });
      }
    });

    it('should handle absolute featureDir path', async () => {
      const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speckit-test-'));
      const repoRoot = testDir;
      const absoluteFeatureDir = path.join(repoRoot, 'specs', '001-create-login-screen');
      
      await fs.mkdir(absoluteFeatureDir, { recursive: true });
      
      const originalCwd = process.cwd();
      process.chdir(repoRoot);
      
      try {
        const paths = await getFeaturePaths({ featureDir: absoluteFeatureDir });

        // Use path normalization for comparison (macOS may normalize /var to /private/var)
        expect(paths.FEATURE_DIR).toBe(path.resolve(absoluteFeatureDir));
        expect(paths.FEATURE_SPEC).toBe(path.join(paths.FEATURE_DIR, 'spec.md'));
        expect(paths.IMPL_PLAN).toBe(path.join(paths.FEATURE_DIR, 'plan.md'));
        expect(paths.TASKS).toBe(path.join(paths.FEATURE_DIR, 'tasks.md'));
        expect(paths.BRANCH).toBe('001-create-login-screen');
      } finally {
        process.chdir(originalCwd);
        await fs.rm(testDir, { recursive: true, force: true });
      }
    });
  });
});
