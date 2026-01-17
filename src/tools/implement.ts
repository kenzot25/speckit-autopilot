import { getFeaturePaths } from '../utils/scripts.js';
import { readFile, parseTasksMd, markTaskComplete, getIncompleteTasks, Task, fileExists } from '../utils/files.js';
import { updateWorkflowState } from '../utils/state.js';
import * as path from 'path';

// Re-export for autopilot
export { getIncompleteTasks };

export interface ImplementResult {
  success: boolean;
  tasksCompleted: number;
  totalTasks: number;
  filesCreated: string[];
  filesModified: string[];
  message: string;
}

/**
 * Execute implementation - this is a placeholder that reports tasks
 * Actual implementation would be done by the LLM calling this tool
 */
export async function speckitImplement(
  featureDir: string,
  autoContinue: boolean = true
): Promise<ImplementResult> {
  const paths = await getFeaturePaths({ requireTasks: true, includeTasks: true, featureDir });
  
  // Validate paths
  if (!paths || !paths.TASKS) {
    throw new Error(`Invalid paths returned: ${JSON.stringify(paths)}`);
  }
  
  if (!(await fileExists(paths.TASKS))) {
    throw new Error('tasks.md not found. Run speckit_tasks first.');
  }
  
  const tasks = await parseTasksMd(paths.TASKS);
  const incompleteTasks = await getIncompleteTasks(paths.TASKS);
  
  // This tool reports the tasks that need to be completed
  // The actual implementation is done by the LLM using other tools
  // This enforces the "no interruptions" rule by returning all tasks at once
  
  return {
    success: true,
    tasksCompleted: tasks.filter(t => t.completed).length,
    totalTasks: tasks.length,
    filesCreated: [],
    filesModified: [],
    message: `Found ${incompleteTasks.length} incomplete tasks. Implementation should proceed automatically without interruptions.`,
  };
}

/**
 * Mark a task as complete
 */
export async function markTaskAsComplete(featureDir: string, taskId: string): Promise<void> {
  const paths = await getFeaturePaths({ requireTasks: true, includeTasks: true, featureDir });
  
  // Validate paths
  if (!paths || !paths.TASKS) {
    throw new Error(`Invalid paths returned: ${JSON.stringify(paths)}`);
  }
  
  if (!taskId || !taskId.trim()) {
    throw new Error('Task ID is required');
  }
  
  await markTaskComplete(paths.TASKS, taskId);
  
  // Update workflow state
  const tasks = await parseTasksMd(paths.TASKS);
  const completed = tasks.filter(t => t.completed).length;
  
  await updateWorkflowState(featureDir, 'implement', {
    tasksCompleted: completed,
    totalTasks: tasks.length,
  });
}
