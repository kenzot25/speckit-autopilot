import * as path from 'path';
import * as fs from 'fs/promises';
import { fileExists, writeFile, readFile } from './files.js';

export interface WorkflowState {
  featureDir: string;
  currentStep: 'specify' | 'clarify' | 'plan' | 'tasks' | 'implement' | 'review' | 'complete';
  stepStatus: {
    specify?: { completed: boolean; branchName?: string; specPath?: string };
    clarify?: { completed: boolean; roundsCompleted?: number; questionsAsked?: number };
    plan?: { completed: boolean; planPath?: string };
    tasks?: { completed: boolean; tasksPath?: string; taskCount?: number };
    implement?: { completed: boolean; tasksCompleted?: number; totalTasks?: number };
    review?: { completed: boolean; iterations?: number; issuesFixed?: number };
    complete?: { completed: boolean };
  };
  metadata: {
    startedAt?: string;
    completedAt?: string;
    featureDescription?: string;
  };
}

const STATE_FILE = '.speckit-workflow-state.json';

/**
 * Get workflow state for a feature directory
 */
export async function getWorkflowState(featureDir: string): Promise<WorkflowState | null> {
  const statePath = path.join(featureDir, STATE_FILE);
  
  if (!(await fileExists(statePath))) {
    return null;
  }
  
  try {
    const content = await readFile(statePath);
    return JSON.parse(content) as WorkflowState;
  } catch {
    return null;
  }
}

/**
 * Set workflow state
 */
export async function setWorkflowState(state: WorkflowState): Promise<void> {
  const statePath = path.join(state.featureDir, STATE_FILE);
  await writeFile(statePath, JSON.stringify(state, null, 2));
}

/**
 * Initialize workflow state
 */
export async function initWorkflowState(
  featureDir: string,
  featureDescription: string
): Promise<WorkflowState> {
  const state: WorkflowState = {
    featureDir,
    currentStep: 'specify',
    stepStatus: {},
    metadata: {
      startedAt: new Date().toISOString(),
      featureDescription,
    },
  };
  
  await setWorkflowState(state);
  return state;
}

/**
 * Update workflow state step
 */
export async function updateWorkflowState(
  featureDir: string,
  step: Exclude<WorkflowState['currentStep'], 'complete'>,
  stepData: Partial<WorkflowState['stepStatus'][typeof step]>
): Promise<WorkflowState> {
  const state = await getWorkflowState(featureDir) || await initWorkflowState(featureDir, '');
  
  state.currentStep = step;
  state.stepStatus[step] = {
    ...state.stepStatus[step],
    ...stepData,
    completed: true,
  } as any;
  
  await setWorkflowState(state);
  return state;
}
