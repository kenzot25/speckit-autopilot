import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { readFile, writeFile, fileExists, parseTasksMd, markTaskComplete, getIncompleteTasks } from '../../utils/files.js';

describe('files utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speckit-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'test content', 'utf-8');

      const content = await readFile(filePath);
      expect(content).toBe('test content');
    });

    it('should throw error for non-existent file', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt');
      
      await expect(readFile(filePath)).rejects.toThrow();
    });

    it('should throw error for undefined path', async () => {
      await expect(readFile(undefined as any)).rejects.toThrow();
    });
  });

  describe('writeFile', () => {
    it('should write file content', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'test content';

      await writeFile(filePath, content);
      
      const readContent = await fs.readFile(filePath, 'utf-8');
      expect(readContent).toBe(content);
    });

    it('should create directory if it does not exist', async () => {
      const filePath = path.join(testDir, 'subdir', 'test.txt');
      const content = 'test content';

      await writeFile(filePath, content);
      
      const readContent = await fs.readFile(filePath, 'utf-8');
      expect(readContent).toBe(content);
    });

    it('should throw error for undefined path', async () => {
      await expect(writeFile(undefined as any, 'content')).rejects.toThrow();
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'test', 'utf-8');

      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt');
      
      const exists = await fileExists(filePath);
      expect(exists).toBe(false);
    });

    it('should handle undefined path gracefully', async () => {
      const exists = await fileExists(undefined as any);
      expect(exists).toBe(false);
    });
  });

  describe('parseTasksMd', () => {
    it('should parse tasks from markdown', async () => {
      const tasksContent = `# Tasks

## Phase 1: Setup
- [ ] T001 Description 1
- [X] T002 Description 2
- [ ] T003 [P] [US1] Description 3

## Phase 2: Implementation
- [ ] T004 Description 4
`;

      const filePath = path.join(testDir, 'tasks.md');
      await fs.writeFile(filePath, tasksContent, 'utf-8');

      const tasks = await parseTasksMd(filePath);
      
      expect(tasks).toHaveLength(4);
      expect(tasks[0]).toMatchObject({
        id: 'T001',
        completed: false,
        description: 'Description 1',
        phase: 'Setup',
      });
      expect(tasks[1]).toMatchObject({
        id: 'T002',
        completed: true,
        description: 'Description 2',
        phase: 'Setup',
      });
      expect(tasks[2]).toMatchObject({
        id: 'T003',
        completed: false,
        description: 'Description 3',
        phase: 'Setup',
        parallel: true,
        story: 'US1',
      });
      expect(tasks[3]).toMatchObject({
        id: 'T004',
        completed: false,
        description: 'Description 4',
        phase: 'Implementation',
      });
    });

    it('should handle empty file', async () => {
      const filePath = path.join(testDir, 'empty.md');
      await fs.writeFile(filePath, '', 'utf-8');

      const tasks = await parseTasksMd(filePath);
      expect(tasks).toHaveLength(0);
    });

    it('should throw error for undefined path', async () => {
      await expect(parseTasksMd(undefined as any)).rejects.toThrow();
    });
  });

  describe('markTaskComplete', () => {
    it('should mark task as complete', async () => {
      const tasksContent = `# Tasks
- [ ] T001 Description 1
- [ ] T002 Description 2
`;

      const filePath = path.join(testDir, 'tasks.md');
      await fs.writeFile(filePath, tasksContent, 'utf-8');

      await markTaskComplete(filePath, 'T001');

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('- [X] T001');
      expect(content).toContain('- [ ] T002');
    });

    it('should throw error for undefined path', async () => {
      await expect(markTaskComplete(undefined as any, 'T001')).rejects.toThrow();
    });

    it('should throw error for undefined taskId', async () => {
      const filePath = path.join(testDir, 'tasks.md');
      await fs.writeFile(filePath, '', 'utf-8');
      
      await expect(markTaskComplete(filePath, undefined as any)).rejects.toThrow();
    });
  });

  describe('getIncompleteTasks', () => {
    it('should return only incomplete tasks', async () => {
      const tasksContent = `# Tasks
- [ ] T001 Description 1
- [X] T002 Description 2
- [ ] T003 Description 3
`;

      const filePath = path.join(testDir, 'tasks.md');
      await fs.writeFile(filePath, tasksContent, 'utf-8');

      const incomplete = await getIncompleteTasks(filePath);
      
      expect(incomplete).toHaveLength(2);
      expect(incomplete.map(t => t.id)).toEqual(['T001', 'T003']);
    });

    it('should throw error for undefined path', async () => {
      await expect(getIncompleteTasks(undefined as any)).rejects.toThrow();
    });
  });
});
