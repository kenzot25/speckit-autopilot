import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Read file content
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error: any) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

/**
 * Write file content
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error: any) {
    throw new Error(`Failed to write file ${filePath}: ${error.message}`);
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse tasks.md and extract task list
 */
export interface Task {
  id: string;
  completed: boolean;
  description: string;
  phase?: string;
  parallel?: boolean;
  story?: string;
}

export async function parseTasksMd(filePath: string): Promise<Task[]> {
  if (!filePath) {
    throw new Error('File path is required');
  }
  
  const content = await readFile(filePath);
  const tasks: Task[] = [];
  const lines = content.split('\n');
  
  let currentPhase = '';
  
  for (const line of lines) {
    // Detect phase headers
    const phaseMatch = line.match(/^##\s+Phase\s+\d+[:\s]+(.+)$/i);
    if (phaseMatch) {
      currentPhase = phaseMatch[1].trim();
      continue;
    }
    
    // Match task lines: - [ ] T001 [P] [US1] Description
    const taskMatch = line.match(/^-\s+\[([\sxX])\]\s+(T\d+)(?:\s+\[P\])?(?:\s+\[(US\d+)\])?\s+(.+)$/);
    if (taskMatch) {
      const [, checked, id, story, description] = taskMatch;
      tasks.push({
        id: id.trim(),
        completed: checked.toLowerCase() === 'x',
        description: description.trim(),
        phase: currentPhase,
        parallel: line.includes('[P]'),
        story: story?.trim(),
      });
    }
  }
  
  return tasks;
}

/**
 * Mark task as complete in tasks.md
 */
export async function markTaskComplete(filePath: string, taskId: string): Promise<void> {
  if (!filePath) {
    throw new Error('File path is required');
  }
  
  if (!taskId || !taskId.trim()) {
    throw new Error('Task ID is required');
  }
  
  const content = await readFile(filePath);
  const lines = content.split('\n');
  
  const updatedLines = lines.map(line => {
    // Match task line with this ID
    const taskMatch = line.match(/^(-\s+\[)([\sxX])(\]\s+)(T\d+)(.+)$/);
    if (taskMatch && taskMatch[4] === taskId) {
      return `${taskMatch[1]}X${taskMatch[3]}${taskMatch[4]}${taskMatch[5]}`;
    }
    return line;
  });
  
  await writeFile(filePath, updatedLines.join('\n'));
}

/**
 * Get incomplete tasks
 */
export async function getIncompleteTasks(filePath: string): Promise<Task[]> {
  if (!filePath) {
    throw new Error('File path is required');
  }
  
  const tasks = await parseTasksMd(filePath);
  return tasks.filter(task => !task.completed);
}
