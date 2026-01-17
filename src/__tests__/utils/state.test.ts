import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  getWorkflowState,
  setWorkflowState,
  initWorkflowState,
  updateWorkflowState,
  WorkflowState,
} from '../../utils/state.js';

describe('state utilities', () => {
  let testDir: string;
  let featureDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speckit-test-'));
    featureDir = path.join(testDir, 'feature');
    await fs.mkdir(featureDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('initWorkflowState', () => {
    it('should initialize workflow state', async () => {
      const state = await initWorkflowState(featureDir, 'Test feature');
      
      expect(state.featureDir).toBe(featureDir);
      expect(state.currentStep).toBe('specify');
      expect(state.metadata.featureDescription).toBe('Test feature');
      expect(state.metadata.startedAt).toBeTruthy();
    });

    it('should create state file', async () => {
      await initWorkflowState(featureDir, 'Test feature');
      
      const statePath = path.join(featureDir, '.speckit-workflow-state.json');
      const exists = await fs.access(statePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('getWorkflowState', () => {
    it('should return null for non-existent state', async () => {
      const state = await getWorkflowState(featureDir);
      expect(state).toBeNull();
    });

    it('should return state for existing file', async () => {
      const initialState = await initWorkflowState(featureDir, 'Test feature');
      const retrievedState = await getWorkflowState(featureDir);
      
      expect(retrievedState).toBeTruthy();
      expect(retrievedState?.featureDir).toBe(initialState.featureDir);
      expect(retrievedState?.currentStep).toBe(initialState.currentStep);
    });
  });

  describe('setWorkflowState', () => {
    it('should save workflow state', async () => {
      const state: WorkflowState = {
        featureDir,
        currentStep: 'plan',
        stepStatus: {
          specify: { completed: true, branchName: '001-test' },
        },
        metadata: {
          startedAt: new Date().toISOString(),
          featureDescription: 'Test feature',
        },
      };
      
      await setWorkflowState(state);
      
      const retrievedState = await getWorkflowState(featureDir);
      expect(retrievedState).toBeTruthy();
      expect(retrievedState?.currentStep).toBe('plan');
      expect(retrievedState?.stepStatus.specify?.completed).toBe(true);
    });
  });

  describe('updateWorkflowState', () => {
    it('should update workflow state step', async () => {
      await initWorkflowState(featureDir, 'Test feature');
      
      const updatedState = await updateWorkflowState(featureDir, 'plan', {
        planPath: '/path/to/plan.md',
      });
      
      expect(updatedState.currentStep).toBe('plan');
      expect(updatedState.stepStatus.plan?.completed).toBe(true);
      expect(updatedState.stepStatus.plan?.planPath).toBe('/path/to/plan.md');
    });

    it('should initialize state if it does not exist', async () => {
      const updatedState = await updateWorkflowState(featureDir, 'tasks', {
        tasksPath: '/path/to/tasks.md',
        taskCount: 5,
      });
      
      expect(updatedState.currentStep).toBe('tasks');
      expect(updatedState.stepStatus.tasks?.completed).toBe(true);
      expect(updatedState.stepStatus.tasks?.taskCount).toBe(5);
    });

    it('should merge step data', async () => {
      await initWorkflowState(featureDir, 'Test feature');
      
      // First update
      await updateWorkflowState(featureDir, 'plan', {
        planPath: '/path/to/plan.md',
      });
      
      // Second update - should merge
      const updatedState = await updateWorkflowState(featureDir, 'plan', {
        planPath: '/path/to/updated-plan.md',
      });
      
      expect(updatedState.stepStatus.plan?.planPath).toBe('/path/to/updated-plan.md');
      expect(updatedState.stepStatus.plan?.completed).toBe(true);
    });
  });
});
