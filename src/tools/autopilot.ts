import { speckitSpecify } from './specify.js';
import { speckitClarify } from './clarify.js';
import { speckitPlan } from './plan.js';
import { speckitTasks } from './tasks.js';
import { speckitImplement } from './implement.js';
import { speckitReview } from './review.js';
import { getFeaturePaths } from '../utils/scripts.js';
import { updateWorkflowState } from '../utils/state.js';
import { parseTasksMd } from '../utils/files.js';

export interface AutopilotOptions {
  skipClarify?: boolean;
  skipReview?: boolean;
  maxClarifyRounds?: number;
  maxReviewIterations?: number;
}

export interface AutopilotResult {
  success: boolean;
  featureDir: string;
  steps: {
    specify?: { success: boolean; branchName?: string; specPath?: string; featureDir?: string };
    clarify?: { success: boolean; roundsCompleted?: number; questionsGenerated?: number; needsAnswers?: boolean; questions?: string[] };
    plan?: { success: boolean; planPath?: string; artifacts?: string[] };
    tasks?: { success: boolean; tasksPath?: string; taskCount?: number; incompleteTasks?: number };
    implement?: { success: boolean; tasksCompleted?: number; totalTasks?: number; needsImplementation?: boolean; incompleteTasks?: Array<{id: string; description: string}> };
    review?: { success: boolean; issuesFixed?: number; buildStatus?: string; issuesFound?: number; needsFixes?: boolean };
  };
  message: string;
  nextAction?: string;
}

/**
 * Execute full autopilot workflow
 * 
 * This orchestrates the complete speckit workflow:
 * 1. Specify - Create feature specification
 * 2. Clarify - Review and clarify (iterative, optional)
 * 3. Plan - Create technical plan
 * 4. Tasks - Generate task list
 * 5. Implement - Execute tasks (automatic, no interruptions)
 * 6. Review - Review code quality (iterative, optional)
 */
export async function speckitAutopilot(
  featureDescription: string,
  options: AutopilotOptions = {}
): Promise<AutopilotResult> {
  const result: AutopilotResult = {
    success: false,
    featureDir: '',
    steps: {},
    message: '',
  };
  
  const maxClarifyRounds = options.maxClarifyRounds || 3;
  const maxReviewIterations = options.maxReviewIterations || 10;
  
  try {
    // Step 1: Specify
    const specifyResult = await speckitSpecify(featureDescription);
    result.featureDir = specifyResult.featureDir;
    result.steps.specify = {
      success: specifyResult.success,
      branchName: specifyResult.branchName,
      specPath: specifyResult.specPath,
      featureDir: specifyResult.featureDir,
    };
    
    if (!specifyResult.success) {
      throw new Error('Specify step failed');
    }
    
    // Step 2: Clarify (optional, iterative)
    if (!options.skipClarify) {
      let clarifyRounds = 0;
      let totalQuestions = 0;
      
      while (clarifyRounds < maxClarifyRounds) {
        const clarifyResult = await speckitClarify(specifyResult.featureDir, 5);
        totalQuestions += clarifyResult.questions.length;
        clarifyRounds++;
        
        result.steps.clarify = {
          success: true,
          roundsCompleted: clarifyRounds,
          questionsGenerated: totalQuestions,
          questions: clarifyResult.questions,
          needsAnswers: clarifyResult.questions.length > 0,
        };
        
        // If no questions generated, we're done with clarification
        if (clarifyResult.questions.length === 0) {
          break;
        }
        
        // In a real implementation, we'd wait for user answers here
        // For now, we'll proceed after first round (user can answer via separate tool calls)
        // The MCP protocol allows the LLM to ask questions and get answers before continuing
        break; // For now, do one round and let LLM handle questions
      }
    }
    
    // Step 3: Plan
    try {
      const planResult = await speckitPlan(specifyResult.featureDir);
      result.steps.plan = {
        success: planResult.success,
        planPath: planResult.planPath,
        artifacts: planResult.artifacts,
      };
      
      if (!planResult.success) {
        throw new Error('Plan step failed');
      }
    } catch (error: any) {
      // Check if error is about multiple spec directories
      if (error.message && error.message.includes('Multiple spec directories')) {
        result.steps.plan = {
          success: false,
          planPath: '',
          artifacts: [],
        };
        throw new Error(
          `Plan step failed: ${error.message}\n` +
          'This usually happens when multiple spec directories share the same numeric prefix.\n' +
          'Consider using a unique prefix or cleaning up old spec directories.'
        );
      }
      throw error;
    }
    
    // Step 4: Tasks
    const tasksResult = await speckitTasks(specifyResult.featureDir);
    const paths = await getFeaturePaths({ requireTasks: true, includeTasks: true, featureDir: specifyResult.featureDir });
    const tasks = await parseTasksMd(paths.TASKS);
    const incompleteTasks = tasks.filter(t => !t.completed);
    
    result.steps.tasks = {
      success: tasksResult.success,
      tasksPath: tasksResult.tasksPath,
      taskCount: tasksResult.taskCount,
      incompleteTasks: incompleteTasks.length,
    };
    
    if (!tasksResult.success) {
      throw new Error('Tasks step failed');
    }
    
    // Step 5: Implement (automatic, no interruptions)
    // This returns the task list - the LLM should execute all tasks automatically
    const implementResult = await speckitImplement(specifyResult.featureDir, true);
    
    // Re-check tasks after implementation to see if they're all complete
    const pathsAfterImpl = await getFeaturePaths({ requireTasks: true, includeTasks: true, featureDir: specifyResult.featureDir });
    const tasksAfterImpl = await parseTasksMd(pathsAfterImpl.TASKS);
    const incompleteTasksAfterImpl = tasksAfterImpl.filter(t => !t.completed);
    
    result.steps.implement = {
      success: true,
      tasksCompleted: implementResult.tasksCompleted,
      totalTasks: implementResult.totalTasks,
      needsImplementation: incompleteTasksAfterImpl.length > 0,
      incompleteTasks: incompleteTasksAfterImpl.map(t => ({
        id: t.id,
        description: t.description,
      })),
    };
    
    // Step 6: Review (optional, iterative)
    // Note: Review should be run AFTER the LLM executes all implementation tasks
    // We don't run review here automatically because tasks haven't been executed yet
    // The LLM should call speckit_review after completing all tasks
    // However, if tasks are already complete (e.g., from a previous run), we can run review now
    if (!options.skipReview && incompleteTasksAfterImpl.length === 0) {
      // Tasks are already complete, so we can run review now
      let reviewIterations = 0;
      let totalIssuesFixed = 0;
      
      while (reviewIterations < maxReviewIterations) {
        const reviewResult = await speckitReview(specifyResult.featureDir, maxReviewIterations);
        reviewIterations++;
        totalIssuesFixed += reviewResult.issuesFixed;
        
        result.steps.review = {
          success: reviewResult.buildStatus === 'pass',
          issuesFixed: totalIssuesFixed,
          buildStatus: reviewResult.buildStatus,
          issuesFound: reviewResult.issuesFound,
          needsFixes: reviewResult.buildStatus === 'fail',
        };
        
        // If build passes, we're done
        if (reviewResult.buildStatus === 'pass') {
          break;
        }
        
        // In a real implementation, fixes would be applied here
        // For now, we'll do one iteration and let the LLM handle fixes
        break;
      }
    }
    
    result.success = true;
    
    // Determine next action and message
    // CRITICAL: Review should ALWAYS be run after implementation completes (unless skipReview is true)
    if (result.steps.implement?.needsImplementation) {
      // Tasks need to be executed
      const reviewNote = options.skipReview ? '' : ' After all tasks are complete, call speckit_review to review code quality.';
      result.message = `Autopilot workflow orchestration completed. ${incompleteTasksAfterImpl.length} task(s) need implementation. Execute all tasks automatically without interruptions.${reviewNote}`;
      result.nextAction = options.skipReview 
        ? 'Execute implementation tasks automatically without interruptions'
        : 'Execute implementation tasks automatically without interruptions, then call speckit_review';
    } else if (result.steps.review?.needsFixes) {
      result.message = 'Autopilot workflow orchestration completed. Review found issues that need fixes.';
      result.nextAction = 'Fix build/compile issues and re-run speckit_review';
    } else if (result.steps.clarify?.needsAnswers) {
      result.message = 'Autopilot workflow orchestration completed. Clarification questions need answers.';
      result.nextAction = 'Answer clarification questions';
    } else if (incompleteTasksAfterImpl.length === 0 && !options.skipReview && !result.steps.review) {
      // All tasks complete but review not run yet - should run review
      result.message = 'Autopilot workflow orchestration completed. All tasks are complete. Call speckit_review to review code quality and fix any issues.';
      result.nextAction = 'Call speckit_review to review code quality and fix any issues';
    } else if (result.steps.review && result.steps.review.success) {
      result.message = 'Autopilot workflow orchestration completed. All steps finished successfully.';
      result.nextAction = 'Workflow complete';
    } else if (incompleteTasksAfterImpl.length === 0 && options.skipReview) {
      result.message = 'Autopilot workflow orchestration completed. All tasks are complete. Review was skipped.';
      result.nextAction = 'Workflow complete';
    } else {
      result.message = 'Autopilot workflow orchestration completed';
      result.nextAction = 'Workflow complete';
    }
    
    return result;
  } catch (error: any) {
    result.success = false;
    result.message = `Autopilot workflow failed: ${error.message}`;
    return result;
  }
}
