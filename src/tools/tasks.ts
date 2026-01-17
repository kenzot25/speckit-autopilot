import { getFeaturePaths, getRepoRoot } from '../utils/scripts.js';
import { readFile, writeFile, fileExists } from '../utils/files.js';
import { updateWorkflowState } from '../utils/state.js';
import * as path from 'path';

export interface TasksResult {
  success: boolean;
  tasksPath: string;
  taskCount: number;
  phases: string[];
  message: string;
}

/**
 * Generate tasks from plan
 */
export async function speckitTasks(featureDir: string): Promise<TasksResult> {
  const paths = await getFeaturePaths({ includeTasks: true, featureDir });
  
  // Validate paths
  if (!paths || !paths.IMPL_PLAN || !paths.FEATURE_SPEC || !paths.TASKS) {
    throw new Error(`Invalid paths returned: ${JSON.stringify(paths)}`);
  }
  
  if (!(await fileExists(paths.IMPL_PLAN))) {
    throw new Error('plan.md not found. Run speckit_plan first.');
  }
  
  if (!(await fileExists(paths.FEATURE_SPEC))) {
    throw new Error('spec.md not found. Run speckit_specify first.');
  }
  
  // Load plan and spec
  const planContent = await readFile(paths.IMPL_PLAN);
  const specContent = await readFile(paths.FEATURE_SPEC);
  
  // Load tasks template
  const repoRoot = getRepoRoot();
  const templatePath = path.join(repoRoot, '.specify/templates/tasks-template.md');
  let tasksContent = '';
  
  if (await fileExists(templatePath)) {
    tasksContent = await readFile(templatePath);
  } else {
    // Basic tasks template
    tasksContent = `# Implementation Tasks

## Phase 1: Setup

## Phase 2: Foundational

## Phase 3: User Stories

## Phase 4: Polish
`;
  }
  
  // Write tasks file
  await writeFile(paths.TASKS, tasksContent);
  
  // Parse tasks to count them
  const taskLines = tasksContent.match(/^-\s+\[[\sxX]\]\s+T\d+/gm) || [];
  const taskCount = taskLines.length;
  
  // Extract phases
  const phaseMatches = tasksContent.match(/^##\s+Phase\s+\d+[:\s]+(.+)$/gm) || [];
  const phases = phaseMatches.map(m => m.replace(/^##\s+Phase\s+\d+[:\s]+/, '').trim());
  
  // Update workflow state
  await updateWorkflowState(featureDir, 'tasks', {
    tasksPath: paths.TASKS,
    taskCount,
  });
  
  return {
    success: true,
    tasksPath: paths.TASKS,
    taskCount,
    phases,
    message: `Tasks generated: ${taskCount} tasks across ${phases.length} phases`,
  };
}
